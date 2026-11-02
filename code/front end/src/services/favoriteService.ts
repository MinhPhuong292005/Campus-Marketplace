import { Listing } from '../types';

const FAVORITES_STORAGE_KEY = 'campus_student_favorites_v1';

export const favoriteService = {
  getFavorites(): Listing[] {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getFavoriteIds(): number[] {
    return this.getFavorites().map((item) => item.id);
  },

  isFavorited(listingId: number): boolean {
    if (!listingId) return false;
    const list = this.getFavorites();
    return list.some((item) => item.id === listingId);
  },

  toggleFavorite(listing: Listing): boolean {
    if (!listing || !listing.id) return false;
    const list = this.getFavorites();
    const index = list.findIndex((item) => item.id === listing.id);
    let isNowFavorited = false;

    if (index >= 0) {
      list.splice(index, 1);
      isNowFavorited = false;
    } else {
      list.unshift(listing);
      isNowFavorited = true;
    }

    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent('campus_favorites_updated', {
          detail: { listingId: listing.id, isFavorited: isNowFavorited },
        })
      );
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }

    return isNowFavorited;
  },

  removeFavorite(listingId: number): void {
    const list = this.getFavorites().filter((item) => item.id !== listingId);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent('campus_favorites_updated', {
          detail: { listingId, isFavorited: false },
        })
      );
    } catch (e) {
      console.error('Failed to update favorites', e);
    }
  },
};
