import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Search, Package, Smartphone } from "lucide-react";
import { productApi } from "../../services/productApi";
import { formatCurrency } from "../../utils/formatters";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../hooks/useToast";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const { showSuccess, showError } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProducts({ page, search: search.trim() || undefined });
      const data = res?.data || res;
      setProducts(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
    } catch (err) {
      showError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate product "${name}"?`)) return;
    try {
      await productApi.deleteProduct(id);
      showSuccess(`Product "${name}" deactivated.`);
      fetchProducts();
    } catch (err) {
      showError("Failed to deactivate product.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Product Catalogue Management
          </h1>
          <p className="text-xs text-slate-500">
            Create, edit, search, and manage products listed in the retail store.
          </p>
        </div>

        <Link to="/admin/products/create">
          <Button variant="primary" icon={Plus}>
            Add New Product
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
        <Input
          placeholder="Search by product name, SKU, brand, model..."
          icon={Search}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <Spinner label="Loading products table..." />
      ) : products.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 p-1">
                        {prod.image_url || prod.image ? (
                          <img
                            src={prod.image_url || prod.image}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Smartphone className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {prod.brand} {prod.model}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-600 font-semibold">{prod.sku}</td>

                    <td className="p-4 text-slate-700 font-medium">
                      {prod.category_name || "General"}
                    </td>

                    <td className="p-4 font-extrabold text-slate-900">
                      {formatCurrency(prod.price)}
                    </td>

                    <td className="p-4 font-bold">
                      {prod.stock_quantity <= 0 ? (
                        <span className="text-red-600 font-extrabold">0 (Out)</span>
                      ) : prod.stock_quantity <= 5 ? (
                        <span className="text-amber-600 font-extrabold">
                          {prod.stock_quantity} (Low)
                        </span>
                      ) : (
                        <span className="text-slate-800">{prod.stock_quantity}</span>
                      )}
                    </td>

                    <td className="p-4">
                      <Badge variant={prod.status === "ACTIVE" ? "success" : "danger"}>
                        {prod.status}
                      </Badge>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <Link to={`/admin/products/${prod.id}/edit`}>
                        <Button variant="outline" size="sm" icon={Edit2}>
                          Edit
                        </Button>
                      </Link>

                      {prod.status === "ACTIVE" && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeactivate(prod.id, prod.name)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              count={totalCount}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No Products Found"
          description="No products match your search query."
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
