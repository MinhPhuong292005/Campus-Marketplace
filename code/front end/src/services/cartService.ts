export interface CartItem {
  id: string; // unique item id
  listingId: number;
  listingTitle: string;
  listingImage: string;
  transactionType: 'SELL' | 'RENT';
  price: number; // daily price for RENT, item price for SELL
  quantity: number; // number of days for RENT, quantity for SELL
  rentalDays?: number;
  sellerId: number;
  sellerName: string;
  sellerStudentCode?: string;
  sellerAvatar?: string;
  sellerKarma?: number;
  rentalTerms?: string;
  safeMeetingPoint?: string;
  selected: boolean;
}

const getStorageKey = () => {
  try {
    const raw = localStorage.getItem('user_info');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return `campus_cart_user_${u.id}`;
    }
  } catch {}
  return 'campus_cart_guest';
};

export const cartService = {
  getCart: (): CartItem[] => {
    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveCart: (items: CartItem[]): void => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('campus_cart_updated', { detail: items }));
    } catch {}
  },

  addToCart: (item: Omit<CartItem, 'id' | 'selected'>): CartItem => {
    const cart = cartService.getCart();
    const existingIndex = cart.findIndex((i) => i.listingId === item.listingId && i.transactionType === item.transactionType);

    let updatedCart: CartItem[];
    let returnedItem: CartItem;

    if (existingIndex > -1) {
      // Update quantity or days
      const existing = cart[existingIndex];
      const newQty = item.transactionType === 'RENT' ? item.quantity : existing.quantity + item.quantity;
      returnedItem = {
        ...existing,
        quantity: Math.max(1, newQty),
        selected: true,
      };
      updatedCart = [...cart];
      updatedCart[existingIndex] = returnedItem;
    } else {
      returnedItem = {
        ...item,
        id: `cart_${item.listingId}_${Date.now()}`,
        selected: true,
      };
      updatedCart = [returnedItem, ...cart];
    }

    cartService.saveCart(updatedCart);
    return returnedItem;
  },

  updateQuantity: (cartItemId: string, quantity: number): void => {
    const cart = cartService.getCart();
    const updated = cart.map((item) =>
      item.id === cartItemId ? { ...item, quantity: Math.max(1, quantity) } : item
    );
    cartService.saveCart(updated);
  },

  toggleSelect: (cartItemId: string): void => {
    const cart = cartService.getCart();
    const updated = cart.map((item) =>
      item.id === cartItemId ? { ...item, selected: !item.selected } : item
    );
    cartService.saveCart(updated);
  },

  toggleSelectSeller: (sellerId: number, selected: boolean): void => {
    const cart = cartService.getCart();
    const updated = cart.map((item) =>
      item.sellerId === sellerId ? { ...item, selected } : item
    );
    cartService.saveCart(updated);
  },

  toggleSelectAll: (selected: boolean): void => {
    const cart = cartService.getCart();
    const updated = cart.map((item) => ({ ...item, selected }));
    cartService.saveCart(updated);
  },

  removeFromCart: (cartItemId: string): void => {
    const cart = cartService.getCart();
    const updated = cart.filter((item) => item.id !== cartItemId);
    cartService.saveCart(updated);
  },

  clearSelectedItems: (): void => {
    const cart = cartService.getCart();
    const updated = cart.filter((item) => !item.selected);
    cartService.saveCart(updated);
  },

  getSelectedItems: (): CartItem[] => {
    const cart = cartService.getCart();
    return cart.filter((item) => item.selected);
  },

  getCartCount: (): number => {
    const cart = cartService.getCart();
    return cart.reduce((sum, item) => sum + (item.transactionType === 'RENT' ? 1 : item.quantity), 0);
  },
};
