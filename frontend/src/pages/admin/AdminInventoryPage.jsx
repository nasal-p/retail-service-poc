import React, { useEffect, useState } from "react";
import { Boxes, AlertTriangle, Edit3, History, CheckCircle2, Search } from "lucide-react";
import { inventoryApi } from "../../services/inventoryApi";
import { formatDate } from "../../utils/formatters";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const AdminInventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getInventory({
        page,
        low_stock: showLowStockOnly ? "true" : undefined,
      });
      const data = res?.data || res;
      setInventory(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
    } catch (err) {
      showError("Failed to fetch inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, showLowStockOnly]);

  const handleOpenAdjust = (item) => {
    setSelectedItem(item);
    setNewQuantity(item.product_stock !== undefined ? item.product_stock : 0);
    setAdjustNote("");
    setAdjustModalOpen(true);
  };

  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      await inventoryApi.adjustStock(
        selectedItem.product_id || selectedItem.product?.id,
        parseInt(newQuantity),
        adjustNote
      );
      showSuccess(`Stock adjusted successfully for ${selectedItem.product_name}!`);
      setAdjustModalOpen(false);
      fetchInventory();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to adjust stock.";
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenHistory = async (item) => {
    setSelectedItem(item);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await inventoryApi.getTransactions(
        item.product_id || item.product?.id
      );
      const data = res?.data || res;
      setTransactions(data.results || []);
    } catch (err) {
      showError("Failed to load audit history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500">
            Real-time stock quantities, threshold warnings, and audit adjustment histories.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs">
          <input
            type="checkbox"
            id="lowStockCheck"
            checked={showLowStockOnly}
            onChange={(e) => {
              setShowLowStockOnly(e.target.checked);
              setPage(1);
            }}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="lowStockCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
            Highlight Low Stock Only
          </label>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading stock items..." />
      ) : inventory.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Low Stock Threshold</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((inv) => {
                  const stock = inv.product_stock !== undefined ? inv.product_stock : inv.product?.stock_quantity;
                  const threshold = inv.low_stock_threshold || 5;
                  const isLow = stock <= threshold;
                  const isOut = stock <= 0;

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isLow ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-900">
                        {inv.product_name || inv.product?.name}
                      </td>

                      <td className="p-4 font-mono text-slate-600 font-semibold">
                        {inv.product_sku || inv.product?.sku}
                      </td>

                      <td className="p-4 font-black text-sm">
                        {isOut ? (
                          <span className="text-red-600 font-black">0</span>
                        ) : isLow ? (
                          <span className="text-amber-600 font-black">{stock}</span>
                        ) : (
                          <span className="text-slate-900">{stock}</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-500 font-semibold">{threshold} units</td>

                      <td className="p-4">
                        {isOut ? (
                          <Badge variant="danger">OUT OF STOCK</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">LOW STOCK ({stock})</Badge>
                        ) : (
                          <Badge variant="success">IN STOCK</Badge>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {user?.role === "ADMIN" && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Edit3}
                            onClick={() => handleOpenAdjust(inv)}
                          >
                            Adjust Stock
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          icon={History}
                          onClick={() => handleOpenHistory(inv)}
                        >
                          Audit History
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
          icon={Boxes}
          title="No Inventory Records"
          description="There are no inventory items matching your threshold filter."
        />
      )}

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock — ${selectedItem?.product_name || ""}`}
      >
        <form onSubmit={handleSubmitAdjust} className="space-y-4">
          <Input
            label="New Absolute Stock Quantity"
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            required
            helperText="Directly updates current stock quantity in store catalogue."
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Adjustment Audit Note
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Physical inventory count correction, supplier shipment received..."
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Confirm Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Inventory Audit History — ${selectedItem?.product_name || ""}`}
        maxWidth="max-w-2xl"
      >
        {loadingHistory ? (
          <Spinner label="Loading audit trail..." />
        ) : transactions.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Qty Change</th>
                  <th className="p-3">New Stock</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3">
                      <Badge variant={t.quantity_change > 0 ? "success" : "danger"}>
                        {t.transaction_type}
                      </Badge>
                    </td>
                    <td className="p-3 font-bold">
                      {t.quantity_change > 0 ? `+${t.quantity_change}` : t.quantity_change}
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">{t.new_stock_quantity}</td>
                    <td className="p-3 text-slate-600">{t.note || "N/A"}</td>
                    <td className="p-3 text-slate-400">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center p-6 italic">
            No stock adjustments or transactions logged for this product.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default AdminInventoryPage;
