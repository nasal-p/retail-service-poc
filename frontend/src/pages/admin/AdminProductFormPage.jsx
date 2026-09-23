import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Package, DollarSign, Image, Tag, Hash } from "lucide-react";
import { productApi } from "../../services/productApi";
import { categoryApi } from "../../services/categoryApi";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";

const AdminProductFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    sku: "",
    category: "",
    description: "",
    price: "",
    cost_price: "",
    stock_quantity: "",
    status: "ACTIVE",
    image: null,
  });

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await categoryApi.getCategories();
        const cats = catRes?.data || catRes || [];
        setCategories(cats);

        if (isEdit) {
          const prodRes = await productApi.getProductById(id);
          const prod = prodRes?.data || prodRes;
          setFormData({
            name: prod.name || "",
            brand: prod.brand || "",
            model: prod.model || "",
            sku: prod.sku || "",
            category: prod.category || "",
            description: prod.description || "",
            price: prod.price || "",
            cost_price: prod.cost_price || "",
            stock_quantity: prod.stock_quantity || "",
            status: prod.status || "ACTIVE",
            image: null,
          });
        }
      } catch (err) {
        showError("Failed to load form data.");
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit, navigate, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        sku: formData.sku,
        category: formData.category ? parseInt(formData.category) : null,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        status: formData.status,
      };

      if (isEdit) {
        await productApi.updateProduct(id, payload);
        showSuccess("Product updated successfully!");
      } else {
        await productApi.createProduct(payload);
        showSuccess("Product created successfully!");
      }
      navigate("/admin/products");
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors && typeof backendErrors === "object") {
        setErrors(backendErrors);
      } else {
        const msg = err.response?.data?.message || err.message || "Failed to save product.";
        showError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading product form..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link to="/admin/products">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Products List
          </Button>
        </Link>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEdit ? "Edit Product" : "Create New Product"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in product specifications, inventory count, and pricing details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              name="name"
              placeholder="e.g. iPhone 17 Pro Max"
              icon={Package}
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={errors.category}
              icon={Tag}
              required
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Brand"
              name="brand"
              placeholder="e.g. Apple"
              value={formData.brand}
              onChange={handleChange}
              error={errors.brand}
              required
            />

            <Input
              label="Model"
              name="model"
              placeholder="e.g. A3106"
              value={formData.model}
              onChange={handleChange}
              error={errors.model}
              required
            />

            <Input
              label="SKU Code"
              name="sku"
              placeholder="e.g. APL-IP17P-256"
              icon={Hash}
              value={formData.sku}
              onChange={handleChange}
              error={errors.sku}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Selling Price ($)"
              type="number"
              step="0.01"
              name="price"
              placeholder="999.99"
              icon={DollarSign}
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              required
            />

            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              name="cost_price"
              placeholder="750.00"
              icon={DollarSign}
              value={formData.cost_price}
              onChange={handleChange}
              error={errors.cost_price}
              required
            />

            <Input
              label="Initial Stock Quantity"
              type="number"
              name="stock_quantity"
              placeholder="10"
              value={formData.stock_quantity}
              onChange={handleChange}
              error={errors.stock_quantity}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              error={errors.status}
              options={[
                { value: "ACTIVE", label: "Active (Visible in Store)" },
                { value: "INACTIVE", label: "Inactive (Hidden)" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Product Description
            </label>
            <textarea
              name="description"
              rows="4"
              placeholder="Enter product description, technical specifications, and box inclusions..."
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/admin/products">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={Save}
            >
              {isEdit ? "Save Product Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductFormPage;
