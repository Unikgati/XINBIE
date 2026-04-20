import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

/// Cart state — list of CartItems with total calculation.
class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addItem(Product product, {int quantity = 1}) {
    final existingIdx = state.indexWhere((item) => item.productId == product.id);
    if (existingIdx >= 0) {
      final updated = List<CartItem>.from(state);
      final existing = updated[existingIdx];
      updated[existingIdx] = CartItem(
        productId: existing.productId,
        name: existing.name,
        price: existing.price,
        discountPrice: existing.discountPrice,
        quantity: existing.quantity + quantity,
        unit: existing.unit,
        imageUrl: existing.imageUrl,
      );
      state = updated;
    } else {
      state = [
        ...state,
        CartItem(
          productId: product.id,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice,
          quantity: quantity,
          unit: product.unit,
          imageUrl: product.imageUrl,
        ),
      ];
    }
  }

  void removeItem(String productId) {
    state = state.where((item) => item.productId != productId).toList();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    state = state.map((item) {
      if (item.productId == productId) {
        return CartItem(
          productId: item.productId,
          name: item.name,
          price: item.price,
          discountPrice: item.discountPrice,
          quantity: quantity,
          unit: item.unit,
          imageUrl: item.imageUrl,
        );
      }
      return item;
    }).toList();
  }

  void clear() {
    state = [];
  }

  double get subtotal => state.fold(0.0, (sum, item) {
    final price = item.discountPrice ?? item.price;
    return sum + (price * item.quantity);
  });

  int get totalItems => state.fold(0, (sum, item) => sum + item.quantity);
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

/// Computed providers
final cartSubtotalProvider = Provider<double>((ref) {
  final cart = ref.watch(cartProvider);
  return cart.fold(0.0, (sum, item) {
    final price = item.discountPrice ?? item.price;
    return sum + (price * item.quantity);
  });
});

final cartItemCountProvider = Provider<int>((ref) {
  final cart = ref.watch(cartProvider);
  return cart.fold(0, (sum, item) => sum + item.quantity);
});
