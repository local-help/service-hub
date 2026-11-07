'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  Sparkles,
  ArrowRight,
  Car,
  Clock,
  Package,
  ChevronRight,
  Tag,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Category, Subcategory, Service, ServiceVariant } from '../../../types';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

const VEHICLE_OPTIONS = [
  { id: 'hatchback', label: 'Hatchback' },
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv_muv', label: 'SUV / MUV' },
  { id: 'bike_scooter', label: 'Bike / Scooter' },
];

const PRESET_ICONS = [
  { id: 'car', label: 'Car & Auto' },
  { id: 'sparkles', label: 'Cleaning & Wash' },
  { id: 'wrench', label: 'Plumbing & Repairs' },
  { id: 'bolt', label: 'Electrical' },
  { id: 'tv', label: 'Appliance & AC' },
  { id: 'briefcase', label: 'General Service' },
];

export default function AdminCataloguePage() {
  const { user, isAdmin } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedSubcatId, setSelectedSubcatId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [categoryModal, setCategoryModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    category?: Category;
  }>({ open: false, mode: 'create' });

  const [subcategoryModal, setSubcategoryModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    subcategory?: Subcategory;
  }>({ open: false, mode: 'create' });

  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    service?: Service;
  }>({ open: false, mode: 'create' });

  const [bundleDrawer, setBundleDrawer] = useState<{
    open: boolean;
    service: Service | null;
    variants: ServiceVariant[];
    loading: boolean;
  }>({ open: false, service: null, variants: [], loading: false });

  const [variantModal, setVariantModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    variant?: ServiceVariant;
  }>({ open: false, mode: 'create' });

  const [priceQuickModal, setPriceQuickModal] = useState<{
    open: boolean;
    service?: Service;
    price: string;
  }>({ open: false, price: '' });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load categories with full data
  const loadCatalogue = async (preserveSelectedCatId?: number) => {
    setLoading(true);
    try {
      const cats = await apiRequest<Category[]>('/admin/categories');
      setCategories(cats || []);
      const targetId = preserveSelectedCatId || selectedCatId || (cats && cats.length > 0 ? cats[0].id : null);
      setSelectedCatId(targetId);
    } catch (err: any) {
      showNotification(err.error || 'Failed to load catalogue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  const currentCategory = categories.find((c) => c.id === selectedCatId);
  const subcategories = currentCategory?.subcategories || [];
  const allServices = currentCategory?.services || currentCategory?.active_services || [];

  const filteredServices = allServices.filter((s) => {
    const matchesSubcat = selectedSubcatId === 'all' || s.subcategory_id === selectedSubcatId;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.short_description || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesSubcat && matchesSearch;
  });

  // --- Category Actions ---
  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      icon_name: formData.get('icon_name') as string,
      position: parseInt(formData.get('position') as string || '0', 10),
      active: formData.get('active') === 'on',
      coming_soon: formData.get('coming_soon') === 'on',
    };

    try {
      if (categoryModal.mode === 'create') {
        const created = await apiRequest<Category>('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showNotification(`Category "${created.name}" created successfully`);
        setCategoryModal({ open: false, mode: 'create' });
        loadCatalogue(created.id);
      } else if (categoryModal.category) {
        const updated = await apiRequest<Category>(`/admin/categories/${categoryModal.category.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showNotification(`Category "${updated.name}" updated successfully`);
        setCategoryModal({ open: false, mode: 'edit' });
        loadCatalogue(updated.id);
      }
    } catch (err: any) {
      showNotification(err.error || 'Failed to save category', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete or deactivate category "${cat.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string; deactivated?: boolean }>(
        `/admin/categories/${cat.id}`,
        { method: 'DELETE' }
      );
      showNotification(res.message || 'Category removed successfully');
      loadCatalogue();
    } catch (err: any) {
      showNotification(err.error || 'Failed to delete category', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Subcategory Actions ---
  const handleSaveSubcategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setActionLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      category_id: selectedCatId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      position: parseInt(formData.get('position') as string || '0', 10),
      active: formData.get('active') === 'on',
    };

    try {
      if (subcategoryModal.mode === 'create') {
        const created = await apiRequest<Subcategory>('/admin/subcategories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showNotification(`Subcategory "${created.name}" created`);
        setSubcategoryModal({ open: false, mode: 'create' });
        loadCatalogue(selectedCatId);
      } else if (subcategoryModal.subcategory) {
        const updated = await apiRequest<Subcategory>(`/admin/subcategories/${subcategoryModal.subcategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showNotification(`Subcategory "${updated.name}" updated`);
        setSubcategoryModal({ open: false, mode: 'edit' });
        loadCatalogue(selectedCatId);
      }
    } catch (err: any) {
      showNotification(err.error || 'Failed to save subcategory', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubcategory = async (subcat: Subcategory) => {
    if (!confirm(`Are you sure you want to delete or deactivate subcategory "${subcat.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>(
        `/admin/subcategories/${subcat.id}`,
        { method: 'DELETE' }
      );
      showNotification(res.message || 'Subcategory deleted');
      loadCatalogue(selectedCatId || undefined);
    } catch (err: any) {
      showNotification(err.error || 'Failed to delete subcategory', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Service Actions ---
  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setActionLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Selected vehicle types
    const vehicles: string[] = [];
    VEHICLE_OPTIONS.forEach((vt) => {
      if (formData.get(`vehicle_${vt.id}`) === 'on') {
        vehicles.push(vt.id);
      }
    });

    const subcatVal = formData.get('subcategory_id') as string;
    const fixedPriceVal = formData.get('fixed_price') as string;
    const durationVal = formData.get('estimated_duration_minutes') as string;

    const payload: any = {
      category_id: parseInt(formData.get('category_id') as string || `${selectedCatId}`, 10),
      subcategory_id: subcatVal ? parseInt(subcatVal, 10) : null,
      name: formData.get('name') as string,
      short_description: formData.get('short_description') as string,
      description: formData.get('description') as string,
      booking_type: formData.get('booking_type') as string,
      fixed_price: fixedPriceVal ? parseFloat(fixedPriceVal) : null,
      estimated_duration_minutes: durationVal ? parseInt(durationVal, 10) : null,
      supported_vehicle_types: vehicles,
      position: parseInt(formData.get('position') as string || '0', 10),
      coming_soon: formData.get('coming_soon') === 'on',
      active: formData.get('active') === 'on',
    };

    try {
      if (serviceModal.mode === 'create') {
        const created = await apiRequest<Service>('/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showNotification(`Service "${created.name}" created successfully`);
        setServiceModal({ open: false, mode: 'create' });
        loadCatalogue(payload.category_id);
      } else if (serviceModal.service) {
        const updated = await apiRequest<Service>(`/admin/services/${serviceModal.service.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showNotification(`Service "${updated.name}" updated successfully`);
        setServiceModal({ open: false, mode: 'edit' });
        loadCatalogue(payload.category_id);
      }
    } catch (err: any) {
      showNotification(err.error || 'Failed to save service', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async (svc: Service) => {
    if (!confirm(`Are you sure you want to delete or deactivate service "${svc.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>(
        `/admin/services/${svc.id}`,
        { method: 'DELETE' }
      );
      showNotification(res.message || 'Service removed');
      loadCatalogue(selectedCatId || undefined);
    } catch (err: any) {
      showNotification(err.error || 'Failed to delete service', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick price save
  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceQuickModal.service) return;
    setActionLoading(true);
    try {
      const price = parseFloat(priceQuickModal.price);
      await apiRequest(`/admin/services/${priceQuickModal.service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fixed_price: price }),
      });
      showNotification(`Price updated for "${priceQuickModal.service.name}" to ₹${price}`);
      setPriceQuickModal({ open: false, price: '' });
      loadCatalogue(selectedCatId || undefined);
    } catch (err: any) {
      showNotification(err.error || 'Failed to update price', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Bundles / Variants Drawer ---
  const handleOpenBundleDrawer = async (svc: Service) => {
    setBundleDrawer({ open: true, service: svc, variants: [], loading: true });
    try {
      const fullSvc = await apiRequest<Service>(`/admin/services/${svc.id}`);
      setBundleDrawer({
        open: true,
        service: fullSvc,
        variants: fullSvc.variants || [],
        loading: false,
      });
    } catch (err: any) {
      showNotification('Failed to load package bundles', 'error');
      setBundleDrawer({ open: true, service: svc, variants: [], loading: false });
    }
  };

  const handleSaveVariant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bundleDrawer.service) return;
    setActionLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const vehicles: string[] = [];
    VEHICLE_OPTIONS.forEach((vt) => {
      if (formData.get(`vt_${vt.id}`) === 'on') {
        vehicles.push(vt.id);
      }
    });

    const priceVal = formData.get('price') as string;
    const price = priceVal ? parseFloat(priceVal) : null;

    const payload: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      position: parseInt(formData.get('position') as string || '0', 10),
      active: formData.get('active') === 'on',
      variant_attributes: {
        vehicle_types: vehicles,
        package_type: formData.get('package_type') as string || 'custom',
      },
      price: price,
    };

    try {
      if (variantModal.mode === 'create') {
        await apiRequest(`/admin/services/${bundleDrawer.service.id}/variants`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showNotification('Package bundle added successfully');
      } else if (variantModal.variant) {
        await apiRequest(`/admin/service_variants/${variantModal.variant.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showNotification('Package bundle updated successfully');
      }
      setVariantModal({ open: false, mode: 'create' });
      // Reload drawer
      if (bundleDrawer.service) handleOpenBundleDrawer(bundleDrawer.service);
      loadCatalogue(selectedCatId || undefined);
    } catch (err: any) {
      showNotification(err.error || 'Failed to save package bundle', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVariant = async (v: ServiceVariant) => {
    if (!confirm(`Are you sure you want to remove package "${v.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>(
        `/admin/service_variants/${v.id}`,
        { method: 'DELETE' }
      );
      showNotification(res.message || 'Package removed');
      if (bundleDrawer.service) handleOpenBundleDrawer(bundleDrawer.service);
      loadCatalogue(selectedCatId || undefined);
    } catch (err: any) {
      showNotification(err.error || 'Failed to delete package', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="border border-slate-200/80 rounded-2xl p-6 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold mb-2">
              <Tag className="w-3 h-3 text-slate-500" />
              <span>Catalogue & Pricing Administration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Services, Bundles & Pricing Manager
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Add, update, or remove categories, subcategories, services, package bundles, and pricing tariffs across Prayagraj.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setCategoryModal({ open: true, mode: 'create' })}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
            </button>
            <button
              onClick={() => setServiceModal({ open: true, mode: 'create' })}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Service</span>
            </button>
          </div>
        </div>

        {/* Categories Tab Strip */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-b border-slate-100 text-xs">
          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCatId(cat.id);
                  setSelectedSubcatId('all');
                }}
                className={`group px-3.5 py-2 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                {cat.coming_soon && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Soon
                  </span>
                )}
                {cat.active === false && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    isSelected ? 'bg-rose-400 text-slate-900' : 'bg-rose-100 text-rose-700'
                  }`}>
                    Off
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Category Details & Controls */}
        {currentCategory && (
          <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{currentCategory.name}</span>
                <span className="text-slate-400 font-mono">/categories/{currentCategory.slug || currentCategory.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentCategory.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {currentCategory.active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">{currentCategory.description || 'No description added.'}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCategoryModal({ open: true, mode: 'edit', category: currentCategory })}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-slate-500" />
                <span>Edit Category</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(currentCategory)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                title="Delete or deactivate category"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subcategories Bar */}
      <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Subcategories</h3>
            <span className="text-xs text-slate-400">({subcategories.length})</span>
          </div>

          <button
            type="button"
            onClick={() => setSubcategoryModal({ open: true, mode: 'create' })}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subcategory</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSelectedSubcatId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              selectedSubcatId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subcategories ({allServices.length})
          </button>

          {subcategories.map((subcat) => {
            const isSelected = selectedSubcatId === subcat.id;
            return (
              <div
                key={subcat.id}
                className={`group px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span onClick={() => setSelectedSubcatId(subcat.id)}>{subcat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {subcat.services_count || 0}
                </span>

                <div className="flex items-center gap-1 border-l pl-1.5 border-slate-200/50">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubcategoryModal({ open: true, mode: 'edit', subcategory: subcat });
                    }}
                    className={`p-0.5 rounded hover:bg-white/20 transition ${isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-700'}`}
                    title="Edit subcategory"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubcategory(subcat);
                    }}
                    className={`p-0.5 rounded hover:bg-white/20 transition ${isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'}`}
                    title="Delete subcategory"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services List & Table */}
      <div className="border border-slate-200/80 rounded-2xl p-6 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Services in {currentCategory?.name || 'Category'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click &ldquo;Bundles & Packages&rdquo; to configure package options, pricing tiers, and vehicle tariffs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search services…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 w-56 sm:w-64 text-slate-900"
              />
            </div>
            <button
              onClick={() => setServiceModal({ open: true, mode: 'create' })}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          </div>
        </div>

        {/* Services Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Service Details</th>
                <th className="p-3">Subcategory</th>
                <th className="p-3">Pricing Model</th>
                <th className="p-3">Fixed Price (Admin)</th>
                <th className="p-3">Bundles / Packages</th>
                <th className="p-3">Vehicles</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No services found in this category / filter. Click "Add Service" above to create one.
                  </td>
                </tr>
              ) : (
                filteredServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/70 transition group">
                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 block text-sm">{svc.name}</span>
                        {svc.active === false && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 font-medium border border-rose-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">
                        {svc.short_description || svc.description}
                      </p>
                      {svc.estimated_duration_minutes && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {svc.estimated_duration_minutes} mins
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-slate-600 font-medium">
                      {svc.subcategory?.name || (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md font-semibold uppercase text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Fixed Price
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{svc.fixed_price || 499}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPriceQuickModal({ open: true, service: svc, price: `${svc.fixed_price || 499}` })}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition"
                          title="Quick Edit Fixed Price"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleOpenBundleDrawer(svc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>Bundles & Packages</span>
                      </button>
                    </td>

                    <td className="p-3">
                      {svc.supported_vehicle_types && svc.supported_vehicle_types.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {svc.supported_vehicle_types.map((vt) => (
                            <span key={vt} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {vt.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="space-y-1">
                        {svc.coming_soon ? (
                          <span className="block text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-center">
                            Coming Soon
                          </span>
                        ) : (
                          <span className="block text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-center">
                            Bookable
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/services/${svc.id}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition"
                          title="Preview service"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setServiceModal({ open: true, mode: 'edit', service: svc })}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md transition"
                          title="Edit Service"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(svc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. CATEGORY MODAL (CREATE / EDIT) */}
      {/* ======================================================== */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {categoryModal.mode === 'create' ? 'Create New Category' : `Edit Category: ${categoryModal.category?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModal({ open: false, mode: 'create' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={categoryModal.category?.name || ''}
                  placeholder="e.g. Car Care & Detailing"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={categoryModal.category?.description || ''}
                  placeholder="Brief description for customer browsing..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Category Icon</label>
                  <select
                    name="icon_name"
                    defaultValue={categoryModal.category?.icon_name || 'car'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900 bg-white"
                  >
                    {PRESET_ICONS.map((ico) => (
                      <option key={ico.id} value={ico.id}>
                        {ico.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Display Position</label>
                  <input
                    type="number"
                    name="position"
                    defaultValue={categoryModal.category?.position ?? 1}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={categoryModal.category?.active !== false}
                    className="rounded text-slate-600 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700">Active in Catalogue</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="coming_soon"
                    defaultChecked={categoryModal.category?.coming_soon === true}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-medium text-slate-700">Coming Soon Flag</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ open: false, mode: 'create' })}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SUBCATEGORY MODAL (CREATE / EDIT) */}
      {/* ======================================================== */}
      {subcategoryModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {subcategoryModal.mode === 'create'
                  ? `Add Subcategory under ${currentCategory?.name}`
                  : `Edit Subcategory: ${subcategoryModal.subcategory?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setSubcategoryModal({ open: false, mode: 'create' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={subcategoryModal.subcategory?.name || ''}
                  placeholder="e.g. Foam Washing & Exterior"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={subcategoryModal.subcategory?.description || ''}
                  placeholder="Optional notes or scope..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Position / Ordering</label>
                <input
                  type="number"
                  name="position"
                  defaultValue={subcategoryModal.subcategory?.position ?? 1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={subcategoryModal.subcategory?.active !== false}
                    className="rounded text-slate-600 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700">Active</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubcategoryModal({ open: false, mode: 'create' })}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving…' : 'Save Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SERVICE MODAL (CREATE / EDIT) */}
      {/* ======================================================== */}
      {serviceModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {serviceModal.mode === 'create'
                  ? 'Create New Service'
                  : `Edit Service: ${serviceModal.service?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setServiceModal({ open: false, mode: 'create' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Category *</label>
                  <select
                    name="category_id"
                    defaultValue={serviceModal.service?.category_id || selectedCatId || ''}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Subcategory (Optional)</label>
                  <select
                    name="subcategory_id"
                    defaultValue={serviceModal.service?.subcategory_id || ''}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900 bg-white"
                  >
                    <option value="">-- No Subcategory --</option>
                    {subcategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Service Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={serviceModal.service?.name || ''}
                  placeholder="e.g. Car Wash or AC Deep Cleaning"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Short Description *</label>
                <input
                  type="text"
                  name="short_description"
                  required
                  defaultValue={serviceModal.service?.short_description || ''}
                  placeholder="One sentence summary for list cards..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Full Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={serviceModal.service?.description || ''}
                  placeholder="Detailed breakdown of what is included, tools used, and scope..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Pricing Model</label>
                  <input
                    type="text"
                    disabled
                    value="Fixed Price (Admin Set)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-500 bg-slate-50 text-xs font-semibold"
                  />
                  <input type="hidden" name="booking_type" value="fixed_price" />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Fixed Price (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    name="fixed_price"
                    defaultValue={serviceModal.service?.fixed_price ?? 499}
                    placeholder="499"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    name="estimated_duration_minutes"
                    defaultValue={serviceModal.service?.estimated_duration_minutes ?? 45}
                    placeholder="45"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                  />
                </div>
              </div>

              {/* Vehicle Types Checkboxes */}
              <div>
                <label className="font-medium text-slate-700 block mb-1.5">
                  Supported Vehicle Types (if applicable)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VEHICLE_OPTIONS.map((vt) => {
                    const isChecked = serviceModal.service?.supported_vehicle_types?.includes(vt.id);
                    return (
                      <label
                        key={vt.id}
                        className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition"
                      >
                        <input
                          type="checkbox"
                          name={`vehicle_${vt.id}`}
                          defaultChecked={isChecked}
                          className="rounded text-slate-600 focus:ring-slate-900"
                        />
                        <span className="text-slate-700">{vt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={serviceModal.service?.active !== false}
                    className="rounded text-slate-600 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700">Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="coming_soon"
                    defaultChecked={serviceModal.service?.coming_soon === true}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-medium text-slate-700">Coming Soon (Preview only)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setServiceModal({ open: false, mode: 'create' })}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving…' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. QUICK PRICE EDIT MODAL */}
      {/* ======================================================== */}
      {priceQuickModal.open && priceQuickModal.service && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <span>Update Base Price</span>
              </h3>
              <button
                type="button"
                onClick={() => setPriceQuickModal({ open: false, price: '' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">
                Update fixed base tariff for <strong className="text-slate-900">{priceQuickModal.service.name}</strong>:
              </p>
              <form onSubmit={handleSaveQuickPrice} className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceQuickModal.price}
                    onChange={(e) => setPriceQuickModal({ ...priceQuickModal, price: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900 text-sm font-bold"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPriceQuickModal({ open: false, price: '' })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs shadow-xs"
                  >
                    {actionLoading ? 'Saving…' : 'Update Price'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. BUNDLES / PACKAGES DRAWER */}
      {/* ======================================================== */}
      {bundleDrawer.open && bundleDrawer.service && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white max-w-2xl w-full h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-slate-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Bundles & Packages: {bundleDrawer.service.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure packages, package-specific pricing, and vehicle-tailored tariffs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBundleDrawer({ open: false, service: null, variants: [], loading: false })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Configured Packages ({bundleDrawer.variants.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    These options show on the customer booking screen.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setVariantModal({ open: true, mode: 'create' })}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Package / Bundle</span>
                </button>
              </div>

              {bundleDrawer.loading ? (
                <div className="space-y-3 py-8">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : bundleDrawer.variants.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No custom packages/bundles added yet. This service uses its default base price.
                  </p>
                  <button
                    type="button"
                    onClick={() => setVariantModal({ open: true, mode: 'create' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Package</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bundleDrawer.variants.map((v) => {
                    const price = v.primary_price || (v.service_pricings && v.service_pricings[0]?.price);
                    const vehicleTypes: string[] = (v.variant_attributes?.vehicle_types as string[]) || [];

                    return (
                      <div
                        key={v.id}
                        className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl transition bg-white shadow-xs space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{v.name}</h4>
                              {v.active === false && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {v.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                {v.description}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base font-bold text-slate-900 block">
                              {price ? `₹${price}` : 'Fixed Price'}
                            </span>
                            <span className="text-[10px] text-slate-400">Fixed Package</span>
                          </div>
                        </div>

                        {/* Vehicle Applicability */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-slate-400" />
                            {vehicleTypes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {vehicleTypes.map((vt) => (
                                  <span key={vt} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                    {vt.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">All vehicle types</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setVariantModal({ open: true, mode: 'edit', variant: v })}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded font-medium transition cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-slate-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v)}
                              className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded transition cursor-pointer"
                              title="Delete package"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Service: <strong className="text-slate-900">{bundleDrawer.service.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setBundleDrawer({ open: false, service: null, variants: [], loading: false })}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PACKAGE / VARIANT MODAL (CREATE / EDIT) */}
      {/* ======================================================== */}
      {variantModal.open && bundleDrawer.service && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {variantModal.mode === 'create'
                  ? 'Add Package / Bundle'
                  : `Edit Package: ${variantModal.variant?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setVariantModal({ open: false, mode: 'create' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Package Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={variantModal.variant?.name || ''}
                  placeholder="e.g. Complete Car Wash (Exterior + Interior)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Package Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={variantModal.variant?.description || ''}
                  placeholder="Inclusions, special features, materials used..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Package Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    defaultValue={variantModal.variant?.primary_price || (variantModal.variant?.service_pricings && variantModal.variant.service_pricings[0]?.price) || 499}
                    placeholder="499"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Package Key / Tag</label>
                  <input
                    type="text"
                    name="package_type"
                    defaultValue={variantModal.variant?.variant_attributes?.package_type || 'standard'}
                    placeholder="e.g. complete_wash"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Vehicle Applicability */}
              <div>
                <label className="font-medium text-slate-700 block mb-1.5">
                  Applies to Vehicles:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_OPTIONS.map((vt) => {
                    const currentVts = (variantModal.variant?.variant_attributes?.vehicle_types as string[]) || [];
                    const isChecked = currentVts.includes(vt.id);
                    return (
                      <label
                        key={vt.id}
                        className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition"
                      >
                        <input
                          type="checkbox"
                          name={`vt_${vt.id}`}
                          defaultChecked={isChecked}
                          className="rounded text-slate-600 focus:ring-slate-900"
                        />
                        <span className="text-slate-700">{vt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={variantModal.variant?.active !== false}
                    className="rounded text-slate-600 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700">Active Package Option</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVariantModal({ open: false, mode: 'create' })}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving…' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
