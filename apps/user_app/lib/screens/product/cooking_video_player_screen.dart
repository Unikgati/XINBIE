import 'package:flutter/material.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import 'package:core/core.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/cart_provider.dart';

class CookingVideoPlayerScreen extends StatefulWidget {
  final CookingVideo video;
  final List<Product> relatedProducts;

  const CookingVideoPlayerScreen({
    super.key,
    required this.video,
    required this.relatedProducts,
  });

  @override
  State<CookingVideoPlayerScreen> createState() => _CookingVideoPlayerScreenState();
}

class _CookingVideoPlayerScreenState extends State<CookingVideoPlayerScreen> {
  late YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = YoutubePlayerController(
      initialVideoId: widget.video.videoId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return YoutubePlayerBuilder(
      player: YoutubePlayer(
        controller: _controller,
        showVideoProgressIndicator: true,
        progressIndicatorColor: AppColors.primary,
      ),
      builder: (context, player) {
        return Scaffold(
          backgroundColor: AppColors.background,
          body: Column(
            children: [
              player,
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.video.title,
                              style: AppTypography.h3.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Gunakan bahan-bahan di bawah ini untuk memulai memasak!',
                              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1),
                      if (widget.relatedProducts.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Consumer(
                          builder: (context, ref, _) {
                            final cart = ref.watch(cartProvider);
                            
                            return ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: widget.relatedProducts.length,
                              itemBuilder: (context, index) {
                                final p = widget.relatedProducts[index];
                                final cartIdx = cart.indexWhere((item) => item.productId == p.id);
                                final currentQty = cartIdx >= 0 ? cart[cartIdx].qty : 0;
                                
                                return DgProductCardHorizontal(
                                  name: p.name,
                                  price: p.price,
                                  unit: p.unit,
                                  imageUrl: p.images.isNotEmpty ? AppConfig.fixImageUrl(p.images.first) : null,
                                  discountPrice: p.discountPrice,
                                  discountPercent: p.discountPercent,
                                  tags: p.tags,
                                  isOutOfStock: !p.isUnlimitedStock && p.stockQty <= 0,
                                  quantity: currentQty,
                                  onTap: () => context.push('/product/${p.id}'),
                                  onAddToCart: () {
                                    if (p.variants != null && p.variants!.isNotEmpty) {
                                      context.push('/product/${p.id}');
                                    } else {
                                      ref.read(cartProvider.notifier).addItem(p);
                                      DgSnackbar.showSuccess(context, message: '1 item ditambahkan ke keranjang');
                                    }
                                  },
                                  onQuantityChanged: (newQty) {
                                    ref.read(cartProvider.notifier).updateQuantity(p.id, newQty);
                                  },
                                );
                              },
                            );
                          },
                        ),
                        const SizedBox(height: 40),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
