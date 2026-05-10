import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/recipe_provider.dart';
import '../../providers/cart_provider.dart';

class RecipeDetailScreen extends ConsumerWidget {
  final String slug;
  const RecipeDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recipeAsync = ref.watch(recipeDetailProvider(slug));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: recipeAsync.when(
        data: (recipe) => _RecipeDetailContent(recipe: recipe),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              const Text('Gagal memuat resep'),
              const SizedBox(height: 16),
              DgButton(
                label: 'Coba Lagi',
                onPressed: () => ref.refresh(recipeDetailProvider(slug)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecipeDetailContent extends ConsumerWidget {
  final Recipe recipe;
  const _RecipeDetailContent({required this.recipe});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CustomScrollView(
      slivers: [
        // App Bar with Hero Image
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: recipe.heroImage != null
                ? CachedNetworkImage(
                    imageUrl: AppConfig.fixImageUrl(recipe.heroImage),
                    fit: BoxFit.cover,
                  )
                : Container(color: AppColors.background),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop(),
            style: IconButton.styleFrom(
              backgroundColor: Colors.black.withOpacity(0.3),
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.share, color: Colors.white),
              onPressed: () {
                final link = 'https://dapurgizi.com/resep/${recipe.slug}';
                Share.share('Masak ${recipe.title} yuk! Cek resepnya di Dapurgizi: $link');
              },
              style: IconButton.styleFrom(
                backgroundColor: Colors.black.withOpacity(0.3),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),

        // Title & Meta
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 32, 20, 20),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            transform: Matrix4.translationValues(0, -20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(recipe.title, style: AppTypography.h2),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.restaurant_menu,
                        size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                        '${recipe.steps.length} Langkah · ${recipe.ingredients.length} Bahan',
                        style: AppTypography.bodySmall),
                  ],
                ),
                const SizedBox(height: 24),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 24),

                 if (recipe.ingredients.isNotEmpty) ...[
                  Text('Bahan-bahan', style: AppTypography.h4),
                  const SizedBox(height: 12),
                  ...recipe.ingredients
                      .map((ing) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Icon(Icons.circle,
                                      size: 6, color: AppColors.primary),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                    child: Text(ing,
                                        style: AppTypography.bodyMedium)),
                              ],
                            ),
                          ))
                      .toList(),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 24),
                ],

                // Bahan Masakan Section
                Text('Bahan Masakan', style: AppTypography.h4),
                const SizedBox(height: 4),
                Text('Beli bahan segar ini di Dapurgizi',
                    style: AppTypography.caption),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),

        // Products List
        if (recipe.products.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final product = recipe.products[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _RecipeProductRow(product: product),
                  );
                },
                childCount: recipe.products.length,
              ),
            ),
          )
        else
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Text('Bahan masakan belum ditautkan.'),
            ),
          ),

        // Cara Membuat Section
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.all(20),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Cara Membuat', style: AppTypography.h4),
                const SizedBox(height: 16),
                ...recipe.steps.map((step) => _StepItem(step: step)).toList(),
              ],
            ),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 40)),
      ],
    );
  }
}

class _RecipeProductRow extends ConsumerWidget {
  final Product product;
  const _RecipeProductRow({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final cartIdx = cart.indexWhere((item) => item.productId == product.id);
    final currentQty = cartIdx >= 0 ? cart[cartIdx].qty : 0;

    final isOutOfStock = !product.isUnlimitedStock && product.stockQty <= 0;

    return Opacity(
      opacity: isOutOfStock ? 0.6 : 1.0,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            // Image
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: AppConfig.fixImageUrl(product.images.firstOrNull),
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                  ),
                ),
                if (isOutOfStock)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: Text(
                          'HABIS',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${CurrencyFormatter.format(product.price)} / ${product.unit}',
                    style: AppTypography.caption.copyWith(color: AppColors.primary),
                  ),
                ],
              ),
            ),
            // Action
            if (isOutOfStock)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Stok Habis',
                  style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                ),
              )
            else if (currentQty == 0)
              IconButton(
                icon: const Icon(Icons.add_circle, color: AppColors.primary),
                onPressed: () {
                  ref.read(cartProvider.notifier).addItem(product);
                  DgSnackbar.showSuccess(context, message: '${product.name} ditambah');
                },
              )
            else
              DgQuantitySelector(
                quantity: currentQty,
                compact: true,
                onChanged: (qty) => ref.read(cartProvider.notifier).updateQuantity(product.id, qty),
              ),
          ],
        ),
      ),
    );
  }
}

class _StepItem extends StatelessWidget {
  final RecipeStep step;
  const _StepItem({required this.step});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${step.stepNumber}',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.instruction,
                  style: AppTypography.bodyMedium.copyWith(height: 1.5),
                ),
                if (step.imageUrl != null && step.imageUrl!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: AppConfig.fixImageUrl(step.imageUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
