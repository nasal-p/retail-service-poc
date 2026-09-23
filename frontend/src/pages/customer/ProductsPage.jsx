import React, { useEffect, useState, useCallback } from "react";
import { Search, Filter, RefreshCw, Smartphone } from "lucide-react";
import { productApi } from "../../services/productApi";
import { categoryApi } from "../../services/categoryApi";
import { cartApi } from "../../services/cartApi";
import ProductCard from "../../components/customer/ProductCard";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [addingId, setAddingId] = useState(null);

  const { isAuthenticated, user, fetchCartCount } = useAuth();
  const { showSuccess, showError } = useToast();

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getCategories();
        const cats = res?.data || res || [];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    loadCategories();
  }, []);

  // Load products when filters or page change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        in_stock: inStockOnly ? "true" : undefined,
      };

      const res = await productApi.getProducts(params);
      const data = res?.data || res;
      setProducts(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
    } catch (err) {
      showError("Unable to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, minPrice, maxPrice, inStockOnly, showError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setPage(1);
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      showError("Please log in to add items to your cart.");
      return;
    }
    if (user?.role !== "CUSTOMER") {
      showError("Staff and Admin accounts cannot add items to cart.");
      return;
    }

    setAddingId(productId);
    try {
      await cartApi.addToCart(productId, 1);
      showSuccess("Added product to cart!");
      fetchCartCount();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.quantity || "Failed to add to cart.";
      showError(msg);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Mobile Catalogue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore smartphones, accessories, and spare parts with live stock availability.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              placeholder="Search by product name, brand, model, SKU..."
              icon={Search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Category Filter */}
          <Select
            placeholder="All Categories"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            options={categories.map((c) => ({ value: c.id, label: `${c.name} (${c.product_count || 0})` }))}
          />

          {/* Reset Filters */}
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleResetFilters}
            className="h-10 self-end"
          >
            Reset Filters
          </Button>
        </div>

        {/* Second Row Filters: Price Range & In-Stock */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input
              type="number"
              placeholder="Min Price ($)"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
              className="w-28 text-xs"
            />
            <span className="text-slate-400 text-xs">-</span>
            <Input
              type="number"
              placeholder="Max Price ($)"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
              className="w-28 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <input
              type="checkbox"
              id="inStockCheck"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="inStockCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Show In-Stock Items Only
            </label>
          </div>
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <Spinner label="Loading catalogue items..." />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={handleAddToCart}
                isAddingToCart={addingId === prod.id}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            count={totalCount}
            onPageChange={(p) => setPage(p)}
          />
        </>
      ) : (
        <EmptyState
          icon={Smartphone}
          title="No products found"
          description="We couldn't find any products matching your selected search or filter criteria."
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          }
        />
      )}
    </div>
  );
};

export default ProductsPage;
