import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:async';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:ui_kit/ui_kit.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/user_providers.dart';
import '../../providers/banner_provider.dart';
import '../../widgets/dg_product_bottom_sheet.dart';
import 'package:core/core.dart'; // To access AppConfig

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(paginatedProductsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final featuredProductsAsync = ref.watch(featuredProductsProvider);
    final promoProductsAsync = ref.watch(promoProductsProvider);
    final paginatedProductsAsync = ref.watch(paginatedProductsProvider);
    
    final authState = ref.watch(authStateProvider);
    final isLoggedIn = authState.valueOrNull ?? false;

    // Dynamic Greeting
    final hour = DateTime.now().hour;
    String timeGreeting = 'Selamat Pagi';
    if (hour >= 12 && hour < 15) timeGreeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) timeGreeting = 'Selamat Sore';
    else if (hour >= 18) timeGreeting = 'Selamat Malam';

    // Kalkulasi padding bawah untuk memberikan ruang pada floating navigation bar
    final bottomPadding = MediaQuery.of(context).padding.bottom + 90;

    // If categories fail = server unreachable → show single full-page error
    final hasConnectionError = categoriesAsync.hasError;

    if (hasConnectionError) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.wifi_off_rounded, size: 64, color: AppColors.textSecondary.withValues(alpha: 0.5)),
                  const SizedBox(height: 20),
                  Text('Tidak dapat terhubung', style: AppTypography.h4),
                  const SizedBox(height: 8),
                  Text(
                    'Periksa koneksi internet Anda\ndan coba lagi',
                    style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  OutlinedButton.icon(
                    onPressed: () {
                      ref.invalidate(categoriesProvider);
                      ref.invalidate(featuredProductsProvider);
                      ref.invalidate(promoProductsProvider);
                      ref.invalidate(paginatedProductsProvider);
                    },
                    icon: const Icon(Icons.refresh, size: 18),
                    label: const Text('Coba Lagi'),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    // Determine if everything is empty (no categories, no products loaded yet or all empty)
    final categoriesData = categoriesAsync.valueOrNull ?? [];
    final featuredData = featuredProductsAsync.valueOrNull ?? [];
    final promoData = promoProductsAsync.valueOrNull ?? [];
    final allData = paginatedProductsAsync.valueOrNull ?? [];
    final isStillLoading = categoriesAsync.isLoading || featuredProductsAsync.isLoading || paginatedProductsAsync.isLoading;
    final isCompletelyEmpty = !isStillLoading && categoriesData.isEmpty && featuredData.isEmpty && promoData.isEmpty && allData.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Top Stack: Banner 1 (Background) + Header + Floating Categories
          SliverToBoxAdapter(
            child: RepaintBoundary(
              child: Stack(
                children: [
                // Layer 1: Top Banner Background (extends behind status bar)
                Container(
                  width: double.infinity,
                  height: isCompletelyEmpty ? 200 : 260, // Shorter when empty
                  decoration: const BoxDecoration(
                    gradient: AppColors.heroGradient,
                    borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                  ),
                ),

                // Layer 2: Content (Search Bar + Categories)
                SafeArea(
                  bottom: false,
                  child: Column(
                    children: [
                      // Greeting Header & Notification
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$timeGreeting, ${isLoggedIn ? 'Sahabat' : 'Tamu'} 👋',
                                  style: AppTypography.labelLarge.copyWith(color: Colors.white70),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Mau masak apa hari ini?',
                                  style: AppTypography.h4.copyWith(
                                    color: Colors.white,
                                    fontSize: 18,
                                    height: 1.1,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            GestureDetector(
                              onTap: () => context.push('/notifications'),
                              child: Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.notifications_outlined, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Search Bar
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 0),
                        child: DgSearchBar(
                          readOnly: true, 
                          hintText: 'Cari sayur, buah, bumbu...',
                          onTap: () => context.push('/search'),
                        ),
                      ),

                      // Only show categories card when there are categories
                      if (!isCompletelyEmpty) ...[
                        // Invisible spacer to push categories down to the overlap position
                        const SizedBox(height: 32),

                        // Floating Categories
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: categoriesAsync.when(
                            data: (categories) {
                              if (categories.isEmpty) return const SizedBox.shrink();
                              
                              // Ambil maksimal 8 kategori untuk ditampilkan di Grid
                              final displayCats = categories.take(8).toList();
                              
                              return LayoutBuilder(
                                builder: (context, constraints) {
                                  // Hitung persis lebar 1/4 dari kontainer
                                  final itemWidth = constraints.maxWidth / 4;
                                  
                                  return Wrap(
                                    runSpacing: 16,
                                    children: displayCats.map((c) {
                                      return SizedBox(
                                        width: itemWidth,
                                        child: Align(
                                          alignment: Alignment.topCenter,
                                          child: _CategoryItem(
                                            iconUrl: c.iconUrl,
                                            fallbackIcon: Icons.category,
                                            label: c.name,
                                            color: Color(int.parse(c.bgColor.replaceFirst('#', '0xFF'))),
                                            onTap: () => context.push('/category/${c.id}?name=${Uri.encodeComponent(c.name)}'),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  );
                                }
                              );
                            },
                            loading: () => DgShimmer.categoryList(),
                            error: (err, stack) => const SizedBox.shrink(),
                          ),
                        ),
                      ],
                      
                      // Bottom padding inside the stack to separate from the next element
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

          // === COMPLETELY EMPTY STATE ===
          if (isCompletelyEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Icon
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.storefront_rounded,
                            size: 36,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      'Toko Sedang Disiapkan',
                      style: AppTypography.h4.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Produk segar dan berkualitas sedang dalam\nperjalanan. Nantikan katalog lengkap dari Dapurgizi!',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            )
          else ...[
            // Promo Banners Section
            SliverToBoxAdapter(
              child: Consumer(
                builder: (context, ref, child) {
                  final promoBannersAsync = ref.watch(promoBannersProvider);
                  
                  return promoBannersAsync.when(
                    data: (banners) {
                      if (banners.isEmpty) return const SizedBox.shrink();
                      
                      return Container(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        child: _PromoBannersCarousel(banners: banners),
                      );
                    },
                    loading: () => DgShimmer.banner(),
                    error: (err, stack) => const SizedBox.shrink(),
                  );
                },
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 8)),

            // 1. Pilihan Dapurgizi 🔥
            featuredProductsAsync.when(
              loading: () => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: DgShimmer.productGrid(count: 2),
                ),
              ),
              error: (e, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
              data: (featuredProducts) {
                if (featuredProducts.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverMainAxisGroup(slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                      child: Text('Pilihan Dapurgizi 🔥', style: AppTypography.h4),
                    ),
                  ),
                  _buildProductGrid(featuredProducts, ref),
                ]);
              },
            ),

            // Inspirasi Masak Section
            SliverToBoxAdapter(
              child: Consumer(
                builder: (context, ref, child) {
                  final videosAsync = ref.watch(cookingVideosProvider);
                  
                  return videosAsync.when(
                    data: (videos) {
                      if (videos.isEmpty) return const SizedBox.shrink();
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 32, 16, 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Inspirasi Masak Hari Ini 🧑‍🍳', style: AppTypography.h4),
                                GestureDetector(
                                  onTap: () => context.push('/cooking-video-gallery'),
                                  child: Text(
                                    'Lihat Semua',
                                    style: AppTypography.labelLarge.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(
                            height: 220,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: videos.length,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemBuilder: (context, index) {
                                final video = videos[index];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 16),
                                  child: DgCookingVideoCard(
                                    video: video,
                                    width: 280,
                                    onTap: () {
                                      context.push('/cooking-video', extra: {
                                        'video': video,
                                        'products': video.products,
                                      });
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      );
                    },
                    loading: () => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 32, 16, 16),
                          child: Container(width: 200, height: 24, color: Colors.grey.shade200),
                        ),
                        SizedBox(
                          height: 220,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: 2,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemBuilder: (context, index) => Padding(
                              padding: const EdgeInsets.only(right: 16),
                              child: DgShimmer.cookingVideo(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    error: (err, _) => const SizedBox.shrink(),
                  );
                },
              ),
            ),

            // 2. Spesial Diskon 💸
            promoProductsAsync.when(
              loading: () => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: DgShimmer.productGrid(count: 2),
                ),
              ),
              error: (e, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
              data: (promoProducts) {
                if (promoProducts.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverMainAxisGroup(slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 32, 16, 12),
                      child: Text('Spesial Diskon 💸', style: AppTypography.h4),
                    ),
                  ),
                  _buildProductGrid(promoProducts, ref),
                ]);
              },
            ),

            // 3. Belanja Harianmu 🛒 (Infinite Scroll)
            paginatedProductsAsync.when(
              loading: () => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: DgShimmer.productGrid(count: 4),
                ),
              ),
              error: (e, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
              data: (allProducts) {
                if (allProducts.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverMainAxisGroup(slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 32, 16, 16),
                      child: Text('Belanja Harianmu 🛒', style: AppTypography.h4),
                    ),
                  ),
                  _buildProductGrid(allProducts, ref),

                  // Loading indicator / End of list indicator
                  if (paginatedProductsAsync.isRefreshing)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12.0),
                        child: DgShimmer.productGrid(count: 2), // Menggunakan shimmer 2 kotak saat load more
                      ),
                    )
                  else if (allProducts.isNotEmpty && !ref.read(paginatedProductsProvider.notifier).hasMore)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Center(
                          child: Text(
                            'Semua produk telah ditampilkan',
                            style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                          ),
                        ),
                      ),
                    ),
                ]);
              },
            ),

            SliverToBoxAdapter(child: SizedBox(height: bottomPadding)),
          ],
        ],
      ),
    );
  }

  // --- HELPER METHODS ---

  Widget _buildProductCard(Product p, WidgetRef ref, BuildContext context) {
    // Find quantity from cart state using granular select for performance
    return Consumer(
      builder: (context, ref, child) {
        final currentQty = ref.watch(cartProvider.select((cart) {
          final idx = cart.indexWhere((item) => item.productId == p.id);
          return idx >= 0 ? cart[idx].qty : 0;
        }));

        return DgProductCard(
          name: p.name,
          price: p.displayPrice,
          unit: p.unit,
          discountPrice: p.displayDiscountPrice,
          discountPercent: p.discountPercent,
          variantCount: p.variants?.length ?? 0,
          hasMultiplePrices: p.hasMultiplePrices,
          quantity: currentQty,
          isOutOfStock: !p.isUnlimitedStock && p.stockQty <= 0,
          imageUrl: AppConfig.fixImageUrl(p.images.firstOrNull),
          tags: p.tags,
          onTap: () => context.push('/product/${p.id}'),
          onAddToCart: () {
            if (p.variants != null && p.variants!.isNotEmpty) {
              context.push('/product/${p.id}');
            } else {
              ref.read(cartProvider.notifier).addItem(p);
            }
          },
          onQuantityChanged: (newQty) {
            ref.read(cartProvider.notifier).updateQuantity(p.id, newQty);
          },
        );
      },
    );
  }



  Widget _buildProductGrid(List<Product> products, WidgetRef ref) {
    if (products.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Text('Belum ada produk', style: AppTypography.bodyMedium),
          ),
        ),
      );
    }
    
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.55,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            if (index >= products.length) return null;
            return _buildProductCard(products[index], ref, context);
          },
          childCount: products.length,
        ),
      ),
    );
  }
}

class _CategoryItem extends StatelessWidget {
  const _CategoryItem({
    this.iconUrl,
    required this.fallbackIcon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final String? iconUrl;
  final IconData fallbackIcon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  Widget _buildIcon(String? url, Color color) {
    if (url == null || url.isEmpty) {
      return Icon(fallbackIcon, color: color, size: 36);
    }
    
    String fullUrl = url;
    if (url.startsWith('/')) {
      final baseUrl = AppConfig.apiBaseUrl.replaceAll('/api', '');
      fullUrl = '$baseUrl$url';
    }
    if (defaultTargetPlatform == TargetPlatform.android && fullUrl.contains('localhost')) {
      fullUrl = fullUrl.replaceAll('localhost', '10.0.2.2');
    }

    if (fullUrl.toLowerCase().endsWith('.svg')) {
      return SvgPicture.network(
        fullUrl,
        width: 36,
        height: 36,
        placeholderBuilder: (_) => Icon(fallbackIcon, color: color, size: 36),
      );
    } else {
      return CachedNetworkImage(
        imageUrl: fullUrl,
        width: 36,
        height: 36,
        placeholder: (_, __) => Icon(fallbackIcon, color: color, size: 36),
        errorWidget: (_, __, ___) => Icon(fallbackIcon, color: color, size: 36),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: _buildIcon(iconUrl, color),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label, 
              style: AppTypography.caption.copyWith(fontWeight: FontWeight.w500, height: 1.2),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _PromoBannersCarousel extends StatefulWidget {
  final List<BannerModel> banners;
  const _PromoBannersCarousel({required this.banners});

  @override
  State<_PromoBannersCarousel> createState() => _PromoBannersCarouselState();
}

class _PromoBannersCarouselState extends State<_PromoBannersCarousel> {
  late PageController _pageController;
  Timer? _timer;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.9);
    if (widget.banners.length > 1) {
      _startAutoScroll();
    }
  }

  void _startAutoScroll() {
    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_pageController.hasClients) {
        int nextPage = _currentPage + 1;
        if (nextPage >= widget.banners.length) {
          nextPage = 0;
          _pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 500),
            curve: Curves.fastOutSlowIn,
          );
        } else {
          _pageController.nextPage(
            duration: const Duration(milliseconds: 500),
            curve: Curves.fastOutSlowIn,
          );
        }
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 140,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.banners.length,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            itemBuilder: (context, index) {
              final banner = widget.banners[index];
              
              String bImageUrl = banner.imageUrl;
              if (bImageUrl.startsWith('/')) {
                final baseUrl = AppConfig.apiBaseUrl.replaceAll('/api', '');
                bImageUrl = '$baseUrl$bImageUrl';
              }
              if (defaultTargetPlatform == TargetPlatform.android && bImageUrl.contains('localhost')) {
                bImageUrl = bImageUrl.replaceAll('localhost', '10.0.2.2');
              }

              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: AppColors.surface,
                ),
                clipBehavior: Clip.antiAlias,
                child: CachedNetworkImage(
                  imageUrl: bImageUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: AppColors.background,
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: AppColors.background,
                    child: const Icon(Icons.broken_image, color: Colors.grey),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.banners.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: _currentPage == index ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: _currentPage == index ? AppColors.primary : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

