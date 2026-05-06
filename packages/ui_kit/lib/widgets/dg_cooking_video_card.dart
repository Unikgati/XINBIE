import 'package:cached_network_image/cached_network_image.dart';
import 'package:core/models/cooking_video.dart';
import 'package:flutter/material.dart';
import 'package:ui_kit/theme/app_colors.dart';
import 'package:ui_kit/theme/app_typography.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

class DgCookingVideoCard extends StatefulWidget {
  final CookingVideo video;
  final double width;
  final VoidCallback? onTap;

  const DgCookingVideoCard({
    super.key,
    required this.video,
    this.width = 280,
    this.onTap,
  });

  @override
  State<DgCookingVideoCard> createState() => _DgCookingVideoCardState();
}

class _DgCookingVideoCardState extends State<DgCookingVideoCard> {
  bool _isPlayerLoaded = false;
  late YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();
  }

  void _initializePlayer() {
    final videoId = widget.video.videoId;
    if (videoId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Video tidak tersedia atau URL tidak valid')),
      );
      return;
    }

    _controller = YoutubePlayerController(
      initialVideoId: videoId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
        disableDragSeek: false,
        loop: false,
        isLive: false,
        forceHD: false,
        enableCaption: true,
      ),
    );
    setState(() {
      _isPlayerLoaded = true;
    });
  }

  @override
  void dispose() {
    if (_isPlayerLoaded) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: widget.onTap ?? _initializePlayer,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: widget.width,
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: _isPlayerLoaded
                    ? YoutubePlayer(
                        controller: _controller,
                        showVideoProgressIndicator: true,
                        progressIndicatorColor: AppColors.primary,
                        progressColors: const ProgressBarColors(
                          playedColor: AppColors.primary,
                          handleColor: AppColors.primaryLight,
                        ),
                      )
                    : _buildThumbnail(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(
                widget.video.title,
                style: AppTypography.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThumbnail() {
    if (widget.video.videoId.isEmpty) {
      return Container(
        color: AppColors.background,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.videocam_off_outlined, color: AppColors.textHint, size: 40),
            const SizedBox(height: 8),
            Text(
              'Video tidak tersedia',
              style: AppTypography.bodySmall.copyWith(color: AppColors.textHint),
            ),
          ],
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        CachedNetworkImage(
          imageUrl: widget.video.mqThumbnailUrl,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: AppColors.background,
            child: const Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
          ),
          errorWidget: (context, url, error) => Container(
            color: AppColors.background,
            child: const Icon(Icons.error_outline, color: AppColors.textHint),
          ),
        ),
        // Dark overlay
        Container(
          color: Colors.black.withOpacity(0.1),
        ),
        // Play button
        Center(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: const Icon(
              Icons.play_arrow_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
        ),
      ],
    );
  }
}
