import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Eye } from "lucide-react";
import { formatCurrency, getProductImage } from "../../utils/formatters";
import Badge from "../common/Badge";
import Button from "../common/Button";

const ProductCard = ({ product, onAddToCart, isAddingToCart = false }) => {
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const imageUrl = getProductImage(product);

  return (
    <div className="group glass-card rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-300">
      {/* Product Image */}
      <div className="relative aspect-4/3 bg-slate-100/70 overflow-hidden flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Stock Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <Badge variant="danger">Out of Stock</Badge>
          ) : isLowStock ? (
            <Badge variant="warning">Low Stock ({product.stock_quantity})</Badge>
          ) : (
            <Badge variant="success">In Stock</Badge>
          )}
        </div>

        {/* Category Tag */}
        {product.category_name && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider text-slate-600 uppercase border border-slate-200/60 shadow-xs">
            {product.category_name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            {product.brand} {product.model ? `• ${product.model}` : ""}
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            <Link to={`/products/${product.id}`}>{product.name}</Link>
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-4">
            {product.description || "High quality mobile product with standard store warranty."}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Price</span>
            <span className="text-lg font-extrabold text-slate-900">
              {formatCurrency(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/products/${product.id}`}>
              <Button variant="outline" size="sm" icon={Eye}>
                Details
              </Button>
            </Link>

            {onAddToCart && (
              <Button
                variant="primary"
                size="sm"
                disabled={isOutOfStock || isAddingToCart}
                isLoading={isAddingToCart}
                onClick={() => onAddToCart(product.id)}
                icon={ShoppingCart}
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
