package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"
)

// AnalyticsResponse represents the structured JSON output
type AnalyticsResponse struct {
	TotalRevenue           float64 `json:"total_revenue"`
	TotalOrders            int64   `json:"total_orders"`
	TopSellingProductName string  `json:"top_selling_product_name"`
	TopSellingProductID   string  `json:"top_selling_product_id"`
}

// Global database pool instance
var db *sql.DB

// Unified raw SQL query leveraging Subquery Factoring (CTEs)
// Computes total revenue, total order count, and top selling product in a single round-trip without table locks
const analyticsQuery = `
WITH revenue_summary AS (
    SELECT 
        COALESCE(SUM(total_amount), 0.00) AS total_revenue,
        COUNT(DISTINCT id) AS total_orders
    FROM orders
    WHERE status = 'COMPLETED' OR status IS NULL
),
all_orders_count AS (
    SELECT COUNT(DISTINCT id) AS total_orders_all
    FROM orders
),
top_product AS (
    SELECT 
        oi.product_id,
        p.name AS product_name,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY oi.product_id, p.name
    ORDER BY total_quantity_sold DESC
    LIMIT 1
)
SELECT 
    rs.total_revenue,
    aoc.total_orders_all AS total_orders,
    COALESCE(tp.product_name, 'N/A') AS top_selling_product_name,
    COALESCE(tp.product_id, 'N/A') AS top_selling_product_id
FROM revenue_summary rs
CROSS JOIN all_orders_count aoc
LEFT JOIN top_product tp ON TRUE;
`

// GetAnalytics executes the unified raw SQL query and maps the result safely
func GetAnalytics(ctx context.Context, db *sql.DB) (*AnalyticsResponse, error) {
	var (
		rawRevenue sql.NullFloat64
		rawOrders  sql.NullInt64
		topName    sql.NullString
		topID      sql.NullString
	)

	// Execute single query with context for timeout / cancellation safety
	err := db.QueryRowContext(ctx, analyticsQuery).Scan(
		&rawRevenue,
		&rawOrders,
		&topName,
		&topID,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Return zero-value struct gracefully if no rows found
			return &AnalyticsResponse{
				TotalRevenue:           0.0,
				TotalOrders:            0,
				TopSellingProductName: "N/A",
				TopSellingProductID:   "N/A",
			}, nil
		}
		return nil, fmt.Errorf("failed to execute analytics query: %w", err)
	}

	result := &AnalyticsResponse{
		TotalRevenue:           0.0,
		TotalOrders:            0,
		TopSellingProductName: "N/A",
		TopSellingProductID:   "N/A",
	}

	if rawRevenue.Valid {
		result.TotalRevenue = rawRevenue.Float64
	}
	if rawOrders.Valid {
		result.TotalOrders = rawOrders.Int64
	}
	if topName.Valid {
		result.TopSellingProductName = topName.String
	}
	if topID.Valid {
		result.TopSellingProductID = topID.String
	}

	return result, nil
}

// AnalyticsHandler handles HTTP GET /admin/analytics
func AnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	// CORS Headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method Not Allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// 5-second timeout for query execution
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	analytics, err := GetAnalytics(ctx, db)
	if err != nil {
		log.Printf("Analytics error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Failed to calculate analytics metrics",
			"details": err.Error(),
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(analytics); err != nil {
		log.Printf("JSON encoding error: %v", err)
	}
}

// HealthHandler provides a quick liveness check
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "fonu-reporting-microservice",
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/fonu_db?sslmode=disable"
	}

	log.Printf("Connecting to PostgreSQL at %s ...", dbURL)

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Database connection initialization failed: %v", err)
	}
	defer db.Close()

	// High-performance connection pool configuration
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	// Verify database connectivity
	pingCtx, pingCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer pingCancel()
	if err := db.PingContext(pingCtx); err != nil {
		log.Printf("Warning: Database ping unready (%v). Service will retry on query.", err)
	} else {
		log.Println("Successfully connected to PostgreSQL!")
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/admin/analytics", AnalyticsHandler)
	mux.HandleFunc("/reports/summary", AnalyticsHandler) // Convenience alias for reporting
	mux.HandleFunc("/health", HealthHandler)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown listener
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Go Analytics Microservice running on http://localhost:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failure: %v", err)
		}
	}()

	<-stopChan
	log.Println("Shutting down microservice gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server shutdown forced: %v", err)
	}
	log.Println("Microservice successfully exited.")
}
