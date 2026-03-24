"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Pause,
  X,
  ImagePlus,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = "products" | "categories";
type ProductView = "list" | "add" | "edit";
type DescriptionTab =
  | "description"
  | "specifications"
  | "reviews"
  | "related"
  | "accessories";

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  offerPrice: string;
  quantity: string;
  freeShipping: string;
  ebayCategoryId: string;
  ebayEpid: string;
  ebayPackageType: string;
  category2L: string;
  dimensionUnits: string;
  length: string;
  width: string;
  ebayHeight: string;
  ebayName: string;
  ebayDescription: string;
  ebayPrice: string;
  ebayPaymentPolicy: string;
  ebayReturnPolicy: string;
  ebayShippingPolicy: string;
  price: string;
  supplier: string;
  weight: string;
  category1L: string;
  category3L: string;
  description: string;
  specifications: string;
  status: "Active" | "Draft";
  image: string | null;
}

interface Category {
  id: number;
  name: string;
  level: "L1" | "L2" | "L3";
  parentCategory: string;
  status: "Active" | "Paused";
  children?: Category[];
  expanded?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUPPLIERS = ["Camec", "ARB", "Dometic", "Companion", "Waeco", "Kings"];
const CATEGORY_1L = [
  "4WD ACC",
  "Camping RV",
  "Caravan RV",
  "Boat & Marine",
  "Electrical",
  "Other",
];
const CATEGORY_2L = [
  "4WD Accessories",
  "4WD Awnings",
  "4WD Electrical",
  "Camping Gear",
  "Marine Parts",
];
const CATEGORY_3L = [
  "Fishing Reels",
  "Fishing Tackle",
  "Rod Holders",
  "Fishing Combos",
  "Fishing Line",
];
const EBAY_PACKAGE_TYPES = [
  "Letter",
  "Large Letter",
  "Parcel",
  "Bulky Goods",
  "Pallet",
];
const DIMENSION_UNITS = ["cm", "mm", "inches"];
const FREE_SHIPPING_OPTIONS = ["Yes", "No"];
const EBAY_POLICIES = [
  "Standard Policy",
  "Express Policy",
  "Economy Policy",
  "Business Policy",
];

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Camec Elite Pro 2 Caravan Mover – Twin Motor Electric Caravan Mover System",
    sku: "043322",
    barcode: "",
    offerPrice: "2790",
    quantity: "10",
    freeShipping: "No",
    ebayCategoryId: "",
    ebayEpid: "",
    ebayPackageType: "Bulky Goods",
    category2L: "",
    dimensionUnits: "cm",
    length: "",
    width: "",
    ebayHeight: "",
    ebayName: "",
    ebayDescription: "",
    ebayPrice: "",
    ebayPaymentPolicy: "",
    ebayReturnPolicy: "",
    ebayShippingPolicy: "",
    price: "3000",
    supplier: "Camec",
    weight: "40",
    category1L: "Caravan RV",
    category3L: "",
    description: "",
    specifications: "",
    status: "Active",
    image: null,
  },
  {
    id: 2,
    name: "Camec 110mm Fixed Black Basin Mixer Tap – Sleek Caravan",
    sku: "051883",
    barcode: "",
    offerPrice: "120.9",
    quantity: "10",
    freeShipping: "No",
    ebayCategoryId: "",
    ebayEpid: "",
    ebayPackageType: "",
    category2L: "",
    dimensionUnits: "cm",
    length: "",
    width: "",
    ebayHeight: "",
    ebayName: "",
    ebayDescription: "",
    ebayPrice: "",
    ebayPaymentPolicy: "",
    ebayReturnPolicy: "",
    ebayShippingPolicy: "",
    price: "130",
    supplier: "Camec",
    weight: "0.7",
    category1L: "Caravan RV",
    category3L: "",
    description: "",
    specifications: "",
    status: "Active",
    image: null,
  },
  {
    id: 3,
    name: "Camec Caravan Floor Matting – 7.0 x 2.5M Premium Outdoor Ground Mat",
    sku: "044093",
    barcode: "",
    offerPrice: "163.5",
    quantity: "10",
    freeShipping: "No",
    ebayCategoryId: "",
    ebayEpid: "",
    ebayPackageType: "",
    category2L: "",
    dimensionUnits: "cm",
    length: "",
    width: "",
    ebayHeight: "",
    ebayName: "",
    ebayDescription: "",
    ebayPrice: "",
    ebayPaymentPolicy: "",
    ebayReturnPolicy: "",
    ebayShippingPolicy: "",
    price: "190",
    supplier: "Camec",
    weight: "6",
    category1L: "Caravan RV",
    category3L: "",
    description: "",
    specifications: "",
    status: "Active",
    image: null,
  },
  {
    id: 4,
    name: "Camec Basin Mixer Replacement Cartridge – Genuine Tap Spare Part",
    sku: "042792",
    barcode: "",
    offerPrice: "10.3",
    quantity: "10",
    freeShipping: "No",
    ebayCategoryId: "",
    ebayEpid: "",
    ebayPackageType: "",
    category2L: "",
    dimensionUnits: "cm",
    length: "",
    width: "",
    ebayHeight: "",
    ebayName: "",
    ebayDescription: "",
    ebayPrice: "",
    ebayPaymentPolicy: "",
    ebayReturnPolicy: "",
    ebayShippingPolicy: "",
    price: "15",
    supplier: "Camec",
    weight: "0.12",
    category1L: "Caravan RV",
    category3L: "",
    description: "",
    specifications: "",
    status: "Active",
    image: null,
  },
  {
    id: 5,
    name: "Camec Premium Caravan Cover – Fits 20ft–22ft (6.0m–6.6m) Caravans",
    sku: "044111",
    barcode: "",
    offerPrice: "372.6",
    quantity: "10",
    freeShipping: "No",
    ebayCategoryId: "",
    ebayEpid: "",
    ebayPackageType: "",
    category2L: "",
    dimensionUnits: "cm",
    length: "",
    width: "",
    ebayHeight: "",
    ebayName: "",
    ebayDescription: "",
    ebayPrice: "",
    ebayPaymentPolicy: "",
    ebayReturnPolicy: "",
    ebayShippingPolicy: "",
    price: "400",
    supplier: "Camec",
    weight: "8",
    category1L: "Caravan RV",
    category3L: "",
    description: "",
    specifications: "",
    status: "Active",
    image: null,
  },
];

const initialCategories: Category[] = [
  {
    id: 1,
    name: "4WD ACC",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
    children: [
      {
        id: 11,
        name: "4WD Accessories",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
        expanded: false,
      },
      {
        id: 12,
        name: "4WD Awnings",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
      {
        id: 13,
        name: "4WD Electrical",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
      {
        id: 14,
        name: "4WD Equipments",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
      {
        id: 15,
        name: "4WD Fridges",
        level: "L2",
        parentCategory: "4WD ACC",
        status: "Active",
      },
    ],
  },
  {
    id: 2,
    name: "BOAT & MARINE",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
    children: [
      {
        id: 21,
        name: "Fishing",
        level: "L2",
        parentCategory: "BOAT & MARINE",
        status: "Active",
        expanded: false,
        children: [
          {
            id: 211,
            name: "Fishing Combos",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 212,
            name: "Fishing Line",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 213,
            name: "Fishing Reels",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 214,
            name: "Fishing Tackle",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
          {
            id: 215,
            name: "Rod Holders",
            level: "L3",
            parentCategory: "Fishing",
            status: "Active",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "CAMPING RV",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
  },
  {
    id: 4,
    name: "CARAVAN RV",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
  },
  {
    id: 5,
    name: "ELECTRICAL",
    level: "L1",
    parentCategory: "-",
    status: "Active",
    expanded: false,
  },
  {
    id: 6,
    name: "FISHING1",
    level: "L1",
    parentCategory: "-",
    status: "Active",
  },
  { id: 7, name: "SALE", level: "L1", parentCategory: "-", status: "Active" },
  { id: 8, name: "test", level: "L1", parentCategory: "-", status: "Active" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const emptyProduct = (): Omit<Product, "id" | "status"> => ({
  name: "",
  sku: "",
  barcode: "",
  offerPrice: "",
  quantity: "",
  freeShipping: "",
  ebayCategoryId: "",
  ebayEpid: "",
  ebayPackageType: "",
  category2L: "",
  dimensionUnits: "",
  length: "",
  width: "",
  ebayHeight: "",
  ebayName: "",
  ebayDescription: "",
  ebayPrice: "",
  ebayPaymentPolicy: "",
  ebayReturnPolicy: "",
  ebayShippingPolicy: "",
  price: "",
  supplier: "",
  weight: "",
  category1L: "",
  category3L: "",
  description: "",
  specifications: "",
  image: null,
});

function validateProduct(
  form: Omit<Product, "id" | "status">,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.sku.trim()) errors.sku = "SKU code is required";
  if (!form.name.trim()) errors.name = "Product name is required";
  if (!form.price.trim()) errors.price = "Price is required";
  else if (isNaN(Number(form.price)) || Number(form.price) <= 0)
    errors.price = "Enter a valid price";
  if (
    form.offerPrice &&
    (isNaN(Number(form.offerPrice)) || Number(form.offerPrice) < 0)
  )
    errors.offerPrice = "Enter a valid offer price";
  if (!form.supplier) errors.supplier = "Supplier is required";
  if (!form.weight.trim()) errors.weight = "Weight is required";
  else if (isNaN(Number(form.weight)) || Number(form.weight) <= 0)
    errors.weight = "Enter a valid weight";
  if (!form.category1L) errors.category1L = "Category 1L is required";
  if (
    form.quantity &&
    (isNaN(Number(form.quantity)) ||
      !Number.isInteger(Number(form.quantity)) ||
      Number(form.quantity) < 0)
  )
    errors.quantity = "Quantity must be a whole number";
  return errors;
}

function validateCategory(form: {
  name: string;
  level: string;
  displayPriority: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Category name is required";
  if (!form.level) errors.level = "Category level is required";
  if (
    form.displayPriority &&
    (isNaN(Number(form.displayPriority)) || Number(form.displayPriority) < 0)
  )
    errors.displayPriority = "Enter a valid number";
  return errors;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
}

function updateCategoryTree(
  cats: Category[],
  id: number,
  updater: (c: Category) => Category,
): Category[] {
  return cats.map((c) => {
    if (c.id === id) return updater(c);
    if (c.children)
      return { ...c, children: updateCategoryTree(c.children, id, updater) };
    return c;
  });
}

function deleteCategoryFromTree(cats: Category[], id: number): Category[] {
  return cats
    .filter((c) => c.id !== id)
    .map((c) =>
      c.children
        ? { ...c, children: deleteCategoryFromTree(c.children, id) }
        : c,
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [productView, setProductView] = useState<ProductView>("list");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Product form
  const [productForm, setProductForm] =
    useState<Omit<Product, "id" | "status">>(emptyProduct());
  const [productErrors, setProductErrors] = useState<Record<string, string>>(
    {},
  );
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [descTab, setDescTab] = useState<DescriptionTab>("description");
  const [productImagePreview, setProductImagePreview] = useState<string | null>(
    null,
  );
  const productImageRef = useRef<HTMLInputElement>(null);

  // Modals
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [pauseCategoryId, setPauseCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    level: "L1",
    tags: "",
    displayPriority: "0",
    image: null as string | null,
  });
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>(
    {},
  );
  const categoryImageRef = useRef<HTMLInputElement>(null);

  // ── Product helpers ───────────────────────────────────────────────────────────

  const updateField = (
    key: keyof Omit<Product, "id" | "status">,
    value: string,
  ) => {
    setProductForm((f) => ({ ...f, [key]: value }));
    if (productErrors[key])
      setProductErrors((e) => {
        const c = { ...e };
        delete c[key];
        return c;
      });
  };

  const openAddProduct = () => {
    router.push("/dashboard/products/add");
  };

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    const { id: _id, status: _s, ...rest } = product;
    setProductForm(rest);
    setProductErrors({});
    setProductImagePreview(product.image);
    setDescTab("description");
    setProductView("edit");
  };

  const saveProduct = (status: "Active" | "Draft") => {
    const errors = validateProduct(productForm);
    if (Object.keys(errors).length > 0) {
      setProductErrors(errors);
      toast({
        title: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }
    if (editingProductId !== null) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId
            ? { ...p, ...productForm, image: productImagePreview, status }
            : p,
        ),
      );
      toast({ title: "Product updated successfully!" });
    } else {
      setProducts((prev) => [
        ...prev,
        { id: Date.now(), ...productForm, image: productImagePreview, status },
      ]);
      toast({
        title:
          status === "Draft"
            ? "Product saved as draft!"
            : "Product published successfully!",
      });
    }
    setProductView("list");
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProductImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeleteProduct = () => {
    if (deleteProductId === null) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
    setDeleteProductId(null);
    toast({ title: "Product deleted!" });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Category helpers ──────────────────────────────────────────────────────────

  const openAddCategory = () => {
    setEditCategoryId(null);
    setCategoryForm({
      name: "",
      level: "L1",
      tags: "",
      displayPriority: "0",
      image: null,
    });
    setCategoryErrors({});
    setShowAddCategory(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      level: cat.level,
      tags: "",
      displayPriority: "0",
      image: null,
    });
    setCategoryErrors({});
    setShowAddCategory(true);
  };

  const saveCategory = () => {
    const errors = validateCategory(categoryForm);
    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      return;
    }
    if (editCategoryId !== null) {
      setCategories((prev) =>
        updateCategoryTree(prev, editCategoryId, (c) => ({
          ...c,
          name: categoryForm.name,
          level: categoryForm.level as "L1" | "L2" | "L3",
        })),
      );
      toast({ title: "Category updated!" });
    } else {
      setCategories((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: categoryForm.name,
          level: categoryForm.level as "L1" | "L2" | "L3",
          parentCategory: "-",
          status: "Active",
        },
      ]);
      toast({ title: "Category added!" });
    }
    setShowAddCategory(false);
  };

  const handleDeleteCategory = () => {
    if (deleteCategoryId === null) return;
    setCategories((prev) => deleteCategoryFromTree(prev, deleteCategoryId));
    setDeleteCategoryId(null);
    toast({ title: "Category deleted!" });
  };

  const handlePauseCategory = () => {
    if (pauseCategoryId === null) return;
    setCategories((prev) =>
      updateCategoryTree(prev, pauseCategoryId, (c) => ({
        ...c,
        status: "Paused",
      })),
    );
    setPauseCategoryId(null);
    toast({ title: "Category paused!" });
  };

  const handleCategoryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setCategoryForm((f) => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ADD / EDIT PRODUCT FULL-PAGE VIEW
  // ─────────────────────────────────────────────────────────────────────────────

  if (productView === "add" || productView === "edit") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProductView("list")}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-base sm:text-lg font-semibold text-gray-800">
                Products &rarr;{" "}
                {productView === "edit" ? "Edit Product" : "Add Product"}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="border-[#1a2b6b] text-[#1a2b6b] hover:bg-blue-50"
                onClick={() => setProductView("list")}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#1a2b6b] text-[#1a2b6b] hover:bg-blue-50"
                onClick={() => saveProduct("Draft")}
              >
                Save as Draft
              </Button>
              <Button
                size="sm"
                className="bg-[#1a2b6b] hover:bg-[#142258] text-white"
                onClick={() => saveProduct("Active")}
              >
                Save to Prod
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
          {/* Image + Fields */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image Upload */}
            <div className="w-full lg:w-56 xl:w-64 flex-shrink-0">
              <div
                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#1a2b6b] transition-colors overflow-hidden"
                onClick={() => productImageRef.current?.click()}
              >
                {productImagePreview ? (
                  <img
                    src={productImagePreview}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 select-none">
                    <div className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-sm">Add Image</span>
                  </div>
                )}
                <input
                  ref={productImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProductImageChange}
                />
              </div>
              {productImagePreview && (
                <button
                  className="mt-2 text-xs text-red-500 hover:underline w-full text-center"
                  onClick={() => setProductImagePreview(null)}
                >
                  Remove image
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {/* SKU code */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    SKU code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter SKU code"
                    value={productForm.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                  />
                  <FieldError msg={productErrors.sku} />
                </div>

                {/* Product Name */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter product name"
                    value={productForm.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                  <FieldError msg={productErrors.name} />
                </div>

                {/* Barcode */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Barcode
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter barcode (optional)"
                    value={productForm.barcode}
                    onChange={(e) => updateField("barcode", e.target.value)}
                  />
                </div>

                {/* Offer Price */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Offer Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter offer price (optional)"
                    value={productForm.offerPrice}
                    onChange={(e) => updateField("offerPrice", e.target.value)}
                  />
                  <FieldError msg={productErrors.offerPrice} />
                </div>

                {/* eBay Category ID */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Category ID
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter eBay category ID (optional)"
                    value={productForm.ebayCategoryId}
                    onChange={(e) =>
                      updateField("ebayCategoryId", e.target.value)
                    }
                  />
                </div>

                {/* Quantity */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Quantity
                  </Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter quantity (integer)"
                    value={productForm.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                  />
                  <FieldError msg={productErrors.quantity} />
                </div>

                {/* eBay EPID */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay EPID
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter eBay EPID (optional)"
                    value={productForm.ebayEpid}
                    onChange={(e) => updateField("ebayEpid", e.target.value)}
                  />
                </div>

                {/* Free Shipping */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Free Shipping
                  </Label>
                  <Select
                    value={productForm.freeShipping}
                    onValueChange={(v) => updateField("freeShipping", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREE_SHIPPING_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* eBay Package Type */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Package Type
                  </Label>
                  <Select
                    value={productForm.ebayPackageType}
                    onValueChange={(v) => updateField("ebayPackageType", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {EBAY_PACKAGE_TYPES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category 2L */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Category 2L
                  </Label>
                  <Select
                    value={productForm.category2L}
                    onValueChange={(v) => updateField("category2L", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_2L.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimension Units */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Dimension Units
                  </Label>
                  <Select
                    value={productForm.dimensionUnits}
                    onValueChange={(v) => updateField("dimensionUnits", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIMENSION_UNITS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* empty cell to keep grid balanced */}
                <div className="hidden sm:block" />

                {/* Length */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Length
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Length"
                    value={productForm.length}
                    onChange={(e) => updateField("length", e.target.value)}
                  />
                </div>

                {/* Width */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Width
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Width"
                    value={productForm.width}
                    onChange={(e) => updateField("width", e.target.value)}
                  />
                </div>

                {/* eBay Height */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Height
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Height"
                    value={productForm.ebayHeight}
                    onChange={(e) => updateField("ebayHeight", e.target.value)}
                  />
                </div>

                {/* eBay Name */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Name
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="eBay listing title"
                    value={productForm.ebayName}
                    onChange={(e) => updateField("ebayName", e.target.value)}
                  />
                </div>

                {/* eBay Description — full width */}
                <div className="sm:col-span-2">
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Description
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="eBay listing description"
                    value={productForm.ebayDescription}
                    onChange={(e) =>
                      updateField("ebayDescription", e.target.value)
                    }
                  />
                </div>

                {/* eBay Price */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Price
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="eBay listing price"
                    value={productForm.ebayPrice}
                    onChange={(e) => updateField("ebayPrice", e.target.value)}
                  />
                </div>

                {/* spacer */}
                <div className="hidden sm:block" />

                {/* eBay Payment Policy */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Payment Policy
                  </Label>
                  <Select
                    value={productForm.ebayPaymentPolicy}
                    onValueChange={(v) => updateField("ebayPaymentPolicy", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment policy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EBAY_POLICIES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* eBay Return Policy */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Return Policy
                  </Label>
                  <Select
                    value={productForm.ebayReturnPolicy}
                    onValueChange={(v) => updateField("ebayReturnPolicy", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select return policy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EBAY_POLICIES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* eBay Shipping Policy — full width */}
                <div className="sm:col-span-2">
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    eBay Shipping Policy
                  </Label>
                  <Select
                    value={productForm.ebayShippingPolicy}
                    onValueChange={(v) => updateField("ebayShippingPolicy", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select shipping policy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EBAY_POLICIES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter price (e.g. 199.99)"
                    value={productForm.price}
                    onChange={(e) => updateField("price", e.target.value)}
                  />
                  <FieldError msg={productErrors.price} />
                </div>

                {/* Select Supplier */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Select Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={productForm.supplier}
                    onValueChange={(v) => updateField("supplier", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIERS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError msg={productErrors.supplier} />
                </div>

                {/* Weight */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Weight <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter weight (e.g. 1.5)"
                    value={productForm.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                  />
                  <FieldError msg={productErrors.weight} />
                </div>

                {/* Category 1L */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Category 1L <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={productForm.category1L}
                    onValueChange={(v) => updateField("category1L", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_1L.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError msg={productErrors.category1L} />
                </div>

                {/* Category 3L */}
                <div>
                  <Label className="text-[#1a2b6b] font-medium text-sm">
                    Category 3L
                  </Label>
                  <Select
                    value={productForm.category3L}
                    onValueChange={(v) => updateField("category3L", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_3L.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Description / Specifications Tabs */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {(
                [
                  "description",
                  "specifications",
                  "reviews",
                  "related",
                  "accessories",
                ] as DescriptionTab[]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setDescTab(t)}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    descTab === t
                      ? "bg-[#1a2b6b] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t === "related"
                    ? "Related Products"
                    : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="p-4">
              {descTab === "description" && (
                <div>
                  {/* Minimal toolbar */}
                  <div className="flex flex-wrap items-center gap-1 border border-gray-200 rounded-t-md px-3 py-2 bg-gray-50 text-sm">
                    <select className="text-xs border-none bg-transparent text-gray-600 outline-none cursor-pointer pr-1">
                      <option>Normal</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <span className="mx-1 text-gray-300 hidden sm:inline">
                      |
                    </span>
                    <button className="w-6 h-6 rounded text-xs font-bold hover:bg-gray-200">
                      B
                    </button>
                    <button className="w-6 h-6 rounded text-xs italic hover:bg-gray-200">
                      I
                    </button>
                    <button className="w-6 h-6 rounded text-xs underline hover:bg-gray-200">
                      U
                    </button>
                    <button className="w-6 h-6 rounded text-xs line-through hover:bg-gray-200">
                      S
                    </button>
                    <span className="mx-1 text-gray-300 hidden sm:inline">
                      |
                    </span>
                    <button className="w-6 h-6 rounded text-xs hover:bg-gray-200">
                      ≡
                    </button>
                    <button className="w-6 h-6 rounded text-xs hover:bg-gray-200">
                      ☰
                    </button>
                    <button className="w-6 h-6 rounded text-xs hover:bg-gray-200">
                      A
                    </button>
                  </div>
                  <Textarea
                    className="rounded-t-none min-h-[120px] resize-y border-t-0"
                    placeholder="Enter product description..."
                    value={productForm.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>
              )}
              {descTab === "specifications" && (
                <Textarea
                  className="min-h-[120px] resize-y"
                  placeholder="Enter product specifications..."
                  value={productForm.specifications}
                  onChange={(e) =>
                    updateField("specifications", e.target.value)
                  }
                />
              )}
              {descTab === "reviews" && (
                <p className="text-sm text-gray-500 py-6 text-center">
                  No reviews yet.
                </p>
              )}
              {descTab === "related" && (
                <p className="text-sm text-gray-500 py-6 text-center">
                  No related products linked.
                </p>
              )}
              {descTab === "accessories" && (
                <p className="text-sm text-gray-500 py-6 text-center">
                  No accessories linked.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 sm:p-6 space-y-4"
    >
      {/* Tab switcher */}
      <div className="flex">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-5 sm:px-8 py-2.5 text-sm font-medium rounded-l-md border transition-colors ${
            activeTab === "products"
              ? "bg-[#1a2b6b] text-white border-[#1a2b6b]"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-5 sm:px-8 py-2.5 text-sm font-medium rounded-r-md border-t border-r border-b transition-colors ${
            activeTab === "categories"
              ? "bg-[#1a2b6b] text-white border-[#1a2b6b]"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Categories
        </button>
      </div>

      {/* Search + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 bg-white"
            placeholder={
              activeTab === "products" ? "Search products..." : "Search Here"
            }
            value={activeTab === "products" ? searchQuery : categorySearch}
            onChange={(e) =>
              activeTab === "products"
                ? setSearchQuery(e.target.value)
                : setCategorySearch(e.target.value)
            }
          />
        </div>
        <Button
          className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6 sm:px-8 py-2.5 whitespace-nowrap"
          onClick={activeTab === "products" ? openAddProduct : openAddCategory}
        >
          Add New +
        </Button>
      </div>

      {/* ── Products Table ─────────────────────────────────────────────────────── */}
      {activeTab === "products" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-700 w-16">
                    Image
                  </th>
                  <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-700">
                    Product Name
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden lg:table-cell">
                    Supplier Name
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden md:table-cell">
                    SKU Code
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden xl:table-cell">
                    Available Quantity
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden xl:table-cell">
                    Weight
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden lg:table-cell">
                    Price
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-[#1a2b6b] whitespace-nowrap hidden xl:table-cell">
                    Offer Price
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                    Status
                  </th>
                  <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3">
                      <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImagePlus className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <p className="font-medium text-gray-800 line-clamp-2 max-w-[200px] xl:max-w-xs">
                        {product.name}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-gray-600 hidden lg:table-cell">
                      {product.supplier}
                    </td>
                    <td className="px-3 py-3 text-gray-600 hidden md:table-cell">
                      {product.sku}
                    </td>
                    <td className="px-3 py-3 text-gray-600 hidden xl:table-cell">
                      {product.quantity || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-600 hidden xl:table-cell">
                      {product.weight ? `${product.weight} kg` : "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-800 hidden lg:table-cell">
                      {product.price ? `$ ${product.price}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-800 hidden xl:table-cell">
                      {product.offerPrice ? `$ ${product.offerPrice}` : "—"}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span
                        className={`text-xs font-medium ${
                          product.status === "Active"
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="text-gray-400 hover:text-[#1a2b6b] transition-colors p-1"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteProductId(product.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Categories Table ─────────────────────────────────────────────────── */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Category Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                    Category Level
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                    Parent Category
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <CategoryRows
                  categories={
                    categorySearch
                      ? categories.filter((c) =>
                          c.name
                            .toLowerCase()
                            .includes(categorySearch.toLowerCase()),
                        )
                      : categories
                  }
                  depth={0}
                  onToggle={(id) =>
                    setCategories((prev) =>
                      updateCategoryTree(prev, id, (c) => ({
                        ...c,
                        expanded: !c.expanded,
                      })),
                    )
                  }
                  onEdit={openEditCategory}
                  onDelete={(id) => setDeleteCategoryId(id)}
                  onPause={(id) => setPauseCategoryId(id)}
                />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Delete Product Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteProductId !== null && (
          <ModalOverlay onClose={() => setDeleteProductId(null)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#1a2b6b]">
                Delete Product?
              </h3>
              <button
                onClick={() => setDeleteProductId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-gray-700">
                Are you sure you want to delete this product?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setDeleteProductId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6"
                onClick={handleDeleteProduct}
              >
                Delete
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Category Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddCategory && (
          <ModalOverlay onClose={() => setShowAddCategory(false)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                {editCategoryId !== null ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={() => setShowAddCategory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Category Image */}
                <div
                  className="w-full sm:w-48 h-44 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#1a2b6b] transition-colors overflow-hidden bg-gray-50 self-start"
                  onClick={() => categoryImageRef.current?.click()}
                >
                  {categoryForm.image ? (
                    <img
                      src={categoryForm.image}
                      alt="Category"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm text-center px-4 select-none">
                      <span className="block text-3xl mb-2">+</span>
                      Add Image
                    </div>
                  )}
                  <input
                    ref={categoryImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCategoryImageChange}
                  />
                </div>

                {/* Category Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Category Name
                    </Label>
                    <Input
                      className="mt-1"
                      placeholder="Search Here"
                      value={categoryForm.name}
                      onChange={(e) => {
                        setCategoryForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }));
                        if (categoryErrors.name)
                          setCategoryErrors((err) => {
                            const c = { ...err };
                            delete c.name;
                            return c;
                          });
                      }}
                    />
                    <FieldError msg={categoryErrors.name} />
                  </div>
                  <div>
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Category Level
                    </Label>
                    <Select
                      value={categoryForm.level}
                      onValueChange={(v) =>
                        setCategoryForm((f) => ({ ...f, level: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L1">L1</SelectItem>
                        <SelectItem value="L2">L2</SelectItem>
                        <SelectItem value="L3">L3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Tags
                    </Label>
                    <Textarea
                      className="mt-1 min-h-[80px] resize-none"
                      placeholder="Add tags..."
                      value={categoryForm.tags}
                      onChange={(e) =>
                        setCategoryForm((f) => ({
                          ...f,
                          tags: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-[#1a2b6b] font-medium text-sm">
                      Display Priority
                    </Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min="0"
                      value={categoryForm.displayPriority}
                      onChange={(e) => {
                        setCategoryForm((f) => ({
                          ...f,
                          displayPriority: e.target.value,
                        }));
                        if (categoryErrors.displayPriority)
                          setCategoryErrors((err) => {
                            const c = { ...err };
                            delete c.displayPriority;
                            return c;
                          });
                      }}
                    />
                    <FieldError msg={categoryErrors.displayPriority} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-5 border-t border-gray-100 pt-4">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setShowAddCategory(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 uppercase tracking-wide px-6"
                onClick={saveCategory}
              >
                Save
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── Delete Category Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteCategoryId !== null && (
          <ModalOverlay onClose={() => setDeleteCategoryId(null)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#1a2b6b]">
                Delete Category?
              </h3>
              <button
                onClick={() => setDeleteCategoryId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-gray-700">Are you sure?</p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setDeleteCategoryId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6"
                onClick={handleDeleteCategory}
              >
                Delete
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── Pause Category Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {pauseCategoryId !== null && (
          <ModalOverlay onClose={() => setPauseCategoryId(null)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#1a2b6b]">
                Pause Category?
              </h3>
              <button
                onClick={() => setPauseCategoryId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-gray-700">
                Are you sure you want to pause this category?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 uppercase tracking-wide px-6"
                onClick={() => setPauseCategoryId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#1a2b6b] hover:bg-[#142258] text-white px-6"
                onClick={handlePauseCategory}
              >
                Pause
              </Button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Modal Overlay ─────────────────────────────────────────────────────────────

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Category Tree Rows ────────────────────────────────────────────────────────

function CategoryRows({
  categories,
  depth,
  onToggle,
  onEdit,
  onDelete,
  onPause,
}: {
  categories: Category[];
  depth: number;
  onToggle: (id: number) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
  onPause: (id: number) => void;
}) {
  return (
    <>
      {categories.map((cat) => (
        <>
          <tr
            key={cat.id}
            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              cat.level === "L2"
                ? "bg-blue-50/40"
                : cat.level === "L3"
                  ? "bg-gray-50/60"
                  : ""
            }`}
          >
            <td className="px-4 py-3">
              <div
                className="flex items-center"
                style={{ paddingLeft: `${depth * 24}px` }}
              >
                {cat.children && cat.children.length > 0 ? (
                  <button
                    onClick={() => onToggle(cat.id)}
                    className="mr-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                  >
                    {cat.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-4 mr-2 flex-shrink-0" />
                )}
                <span className="font-medium text-gray-800 text-sm">
                  {cat.name}
                </span>
              </div>
            </td>
            <td className="px-4 py-3 text-gray-600 text-sm hidden sm:table-cell">
              {cat.level || "—"}
            </td>
            <td className="px-4 py-3 text-gray-600 text-sm hidden md:table-cell">
              {cat.parentCategory || "—"}
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
              <span
                className={`text-sm font-medium ${
                  cat.status === "Active" ? "text-green-600" : "text-amber-500"
                }`}
              >
                {cat.status}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(cat)}
                  className="text-gray-400 hover:text-[#1a2b6b] transition-colors p-1"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onPause(cat.id)}
                  className="text-gray-400 hover:text-amber-500 transition-colors p-1"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
          {cat.expanded && cat.children && (
            <CategoryRows
              categories={cat.children}
              depth={depth + 1}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onPause={onPause}
            />
          )}
        </>
      ))}
    </>
  );
}
