import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Wrench,
  ShieldCheck,
  Truck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { productApi } from "../../services/productApi";
import { serviceApi } from "../../services/serviceApi";
import ProductCard from "../../components/customer/ProductCard";
import ServiceCard from "../../components/customer/ServiceCard";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { cartApi } from "../../services/cartApi";
import { useToast } from "../../hooks/useToast";

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  const { isAuthenticated, user, fetchCartCount } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, servRes] = await Promise.all([
          productApi.getProducts({ page_size: 4 }),
          serviceApi.getServices(),
        ]);

        const prods = prodRes?.data?.results || prodRes?.results || [];
        const servs = servRes?.data || servRes || [];

        setFeaturedProducts(prods.slice(0, 4));
        setPopularServices(servs.slice(0, 3));
      } catch (err) {
        console.error("Home page fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      showError("Please log in to add items to your cart.");
      return;
    }
    if (user?.role !== "CUSTOMER") {
      showError("Staff and Admin accounts cannot place customer cart items.");
      return;
    }

    setAddingId(productId);
    try {
      await cartApi.addToCart(productId, 1);
      showSuccess("Item added to your shopping cart!");
      fetchCartCount();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add product.";
      showError(msg);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold tracking-wide border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Retail Mobile Shop & Certified Service Center</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Your Trusted Mobile Store & <span className="text-gradient-primary">Repair Experts</span>
              </h1>

              <p className="text-base text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Mobile Phones • Genuine Accessories • Same-Day Express Repairs. Experience seamless shopping and transparent device repair tracking.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/products">
                  <Button variant="primary" size="lg" icon={Smartphone}>
                    Shop Products
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg" icon={Wrench}>
                    Book a Repair
                  </Button>
                </Link>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/60 max-w-md mx-auto lg:mx-0 text-slate-600 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Genuine
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Express Repair
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" /> Fast Delivery
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-lg glass-card rounded-3xl p-8 border border-white/80 shadow-2xl relative">
                <div className="absolute -top-4 -right-4 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg">
                  <Wrench className="w-8 h-8" />
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Need a Quick Screen or Battery Fix?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Book your repair ticket online in under 60 seconds. Track live repair status from diagnosis to completion.
                  </p>
                  <div className="pt-2">
                    <Link to="/services/book">
                      <Button variant="secondary" fullWidth icon={ArrowRight} className="flex-row-reverse">
                        Generate Repair Ticket Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
              Catalogue Highlights
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link to="/products">
            <Button variant="ghost" size="sm" icon={ArrowRight} className="flex-row-reverse">
              View All Products
            </Button>
          </Link>
        </div>

        {loading ? (
          <Spinner />
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={handleAddToCart}
                isAddingToCart={addingId === prod.id}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8 text-sm">No featured products available.</p>
        )}
      </section>

      {/* 3. Popular Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
              Certified Repairs
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Services
            </h2>
          </div>
          <Link to="/services">
            <Button variant="ghost" size="sm" icon={ArrowRight} className="flex-row-reverse">
              Explore All Services
            </Button>
          </Link>
        </div>

        {loading ? (
          <Spinner />
        ) : popularServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularServices.map((serv) => (
              <ServiceCard key={serv.id} service={serv} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8 text-sm">No repair services available.</p>
        )}
      </section>

      {/* 4. Why Choose Us */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
              Why MobileCenter
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Why Customers Choose Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Genuine Parts Warranty</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All replacements and repairs use official OEM certified parts with standard store warranty.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Real-Time Ticket Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stay updated at every step from initial diagnostics to repair completion and collection readiness.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Atomic Concurrency Store</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Server-side calculated orders and real-time inventory management ensure stock accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-cta rounded-3xl p-10 sm:p-14 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Upgrade or Repair Your Device?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Browse our latest smartphones or schedule a certified repair appointment online today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/products">
              <Button variant="primary" size="lg">
                Browse Shop
              </Button>
            </Link>
            <Link to="/services/book">
              <Button variant="outline" size="lg" className="bg-transparent border-slate-600 text-white hover:bg-slate-800">
                Book Repair
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
