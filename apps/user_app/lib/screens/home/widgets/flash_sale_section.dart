import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:go_router/go_router.dart';
import '../../../providers/product_provider.dart';
import 'flash_sale_countdown.dart';

class FlashSaleSection extends ConsumerWidget {
  const FlashSaleSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Initialize socket listener
    ref.watch(flashSaleSocketProvider);
    
    final flashSaleAsync = ref.watch(activeFlashSaleProvider);
    final stockUpdates = ref.watch(flashSaleStockUpdatesProvider);

    return flashSaleAsync.when(
      data: (session) {
        if (session == null || session.items.isEmpty) {
          return const SizedBox.shrink();
        }

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Text(
                            session.title,
                            style: AppTypography.h4,
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.bolt, color: Colors.orange, size: 24),
                        ],
                      ),
                    ),
                    FlashSaleCountdown(endTime: session.endAt),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // Horizontal Scroll List
              SizedBox(
                height: 280, // Adjust based on card height
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: session.items.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final item = session.items[index];
                    final product = item.product!;
                    
                    // Real-time stock override
                    final update = stockUpdates[item.id];
                    final displaySoldQty = update?.soldQty ?? item.soldQty;
                    final displayStockQty = update?.stockQty ?? item.stockQty;
                    
                    return SizedBox(
                      width: 160,
                      child: DgProductCard(
                        name: product.name,
                        price: product.price,
                        unit: product.unit,
                        imageUrl: product.images.isNotEmpty ? AppConfig.fixImageUrl(product.images.first) : null,
                        discountPrice: item.flashPrice,
                        discountPercent: ((1 - item.flashPrice / product.price) * 100).round(),
                        isOutOfStock: displaySoldQty >= displayStockQty,
                        tags: const ['Flash Sale'],
                        onTap: () => context.push('/product/${product.id}'),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const _FlashSaleLoadingSkeleton(),
      error: (err, stack) {
        debugPrint('Flash Sale failed to load: $err');
        return const SizedBox.shrink();
      },
    );
  }
}

class _FlashSaleLoadingSkeleton extends StatelessWidget {
  const _FlashSaleLoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 24),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(width: 24, height: 24, color: Colors.grey[200]),
              const SizedBox(width: 8),
              Container(width: 150, height: 20, color: Colors.grey[200]),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 280,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 3,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) => Container(
                width: 160,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
