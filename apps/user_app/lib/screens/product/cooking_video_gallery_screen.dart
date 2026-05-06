import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/product_provider.dart';

class CookingVideoGalleryScreen extends ConsumerWidget {
  const CookingVideoGalleryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final videosAsync = ref.watch(cookingVideosProvider);

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

          return GridView.builder(
            padding: const EdgeInsets.all(20),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 1,
              childAspectRatio: 1.4,
              mainAxisSpacing: 20,
            ),
            itemCount: videos.length,
            itemBuilder: (context, index) {
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
          );
        },
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: 4,
          separatorBuilder: (_, __) => const SizedBox(height: 20),
          itemBuilder: (_, __) => DgShimmer.cookingVideo(width: double.infinity),
        ),
        error: (err, _) => Center(child: Text('Gagal memuat video: $err')),
      ),
    );
  }
}
