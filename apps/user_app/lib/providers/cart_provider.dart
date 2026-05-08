import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

/// Cart state — list of CartItems with total calculation.
class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addItem(Product product, {int quantity = 1, ProductVariant? variant, int? price}) {
    // Check if same product AND same variant exists
    final existingIdx = state.indexWhere((item) => 
        item.productId == product.id && item.variantId == variant?.id);
        
    if (existingIdx >= 0) {
      final updated = List<CartItem>.from(state);
      final existing = updated[existingIdx];
      updated[existingIdx] = existing.copyWith(
        qty: existing.qty + quantity,
        unitPrice: price ?? existing.unitPrice, // Update price if provided
      );
      state = updated;
    } else {
      final finalPrice = price ?? (variant != null && variant.price > 0 
          ? (variant.discountPrice ?? variant.price)
          : (product.discountPrice ?? product.price));
          
      state = [
        ...state,
        CartItem(
          productId: product.id,
          variantId: variant?.id,
          productName: product.name,
          variantName: variant?.name,
          unitPrice: finalPrice,
          qty: quantity,
          unit: product.unit,
          productImage: variant?.imageUrl ?? (product.images.isNotEmpty ? product.images.first : null),
        ),
      ];
    }
  }

  void removeItem(String productId, {String? variantId}) {
    state = state.where((item) => !(item.productId == productId && item.variantId == variantId)).toList();
  }

  void updateQuantity(String productId, int quantity, {String? variantId}) {
    if (quantity <= 0) {
      removeItem(productId, variantId: variantId);
      return;
    }
    state = state.map((item) {
      if (item.productId == productId && item.variantId == variantId) {
        return item.copyWith(qty: quantity);
      }
      return item;
    }).toList();
  }

  void clear() {
    state = [];
  }

  double get subtotal => state.fold(0.0, (sum, item) {
    final price = item.unitPrice ?? 0;
    return sum + (price * item.qty);
  });

  int get totalItems => state.fold(0, (sum, item) => sum + item.qty);
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

/// Computed providers
final cartSubtotalProvider = Provider<double>((ref) {
  final cart = ref.watch(cartProvider);
  return cart.fold(0.0, (sum, item) {
    final price = item.unitPrice ?? 0;
    return sum + (price * item.qty);
  });
});

final cartItemCountProvider = Provider<int>((ref) {
  final cart = ref.watch(cartProvider);
  return cart.fold(0, (sum, item) => sum + item.qty);
});
