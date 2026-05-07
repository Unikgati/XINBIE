import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/product_provider.dart';

class CookingVideoGalleryScreen extends ConsumerStatefulWidget {
  const CookingVideoGalleryScreen({super.key});

  @override
  ConsumerState<CookingVideoGalleryScreen> createState() => _CookingVideoGalleryScreenState();
}

class _CookingVideoGalleryScreenState extends ConsumerState<CookingVideoGalleryScreen> {
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
      ref.read(paginatedCookingVideosProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final videosAsync = ref.watch(paginatedCookingVideosProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Inspirasi Masak',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
      ),
      body: videosAsync.when(
        data: (videos) {
          if (videos.isEmpty) {
            return const Center(
              child: DgEmptyState(
                icon: Icons.video_library_outlined,
                title: 'Belum Ada Video',
                subtitle: 'Nantikan inspirasi resep masakan sehat dari Dapurgizi!',
              ),
            );
          }

          final hasMore = ref.read(paginatedCookingVideosProvider.notifier).hasMore;

          return RefreshIndicator(
            onRefresh: () => ref.refresh(paginatedCookingVideosProvider.future),
            child: GridView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 1,
                childAspectRatio: 1.4,
                mainAxisSpacing: 20,
              ),
              itemCount: videos.length + (hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == videos.length) {
                  return DgShimmer.cookingVideo(width: double.infinity);
                }
                
                final video = videos[index];
                return DgCookingVideoCard(
                  video: video,
                  width: double.infinity,
                  onTap: () {
                    context.push('/cooking-video', extra: {
                      'video': video,
                      'products': video.products,
                    });
                  },
                );
              },
            ),
          );
        },
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: 4,
          separatorBuilder: (_, __) => const SizedBox(height: 20),
          itemBuilder: (_, __) => DgShimmer.cookingVideo(width: double.infinity),
        ),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Gagal memuat video: $err'),
              TextButton(
                onPressed: () => ref.refresh(paginatedCookingVideosProvider),
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
