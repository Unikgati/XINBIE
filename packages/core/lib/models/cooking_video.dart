import 'package:freezed_annotation/freezed_annotation.dart';
import 'product.dart';

part 'cooking_video.freezed.dart';
part 'cooking_video.g.dart';

@freezed
abstract class CookingVideo with _$CookingVideo {
  const factory CookingVideo({
    required String id,
    required String title,
    String? youtubeUrl,
    DateTime? createdAt,
    @Default([]) List<Product> products,
  }) = _CookingVideo;

  factory CookingVideo.fromJson(Map<String, dynamic> json) =>
      _$CookingVideoFromJson(json);
}

extension CookingVideoX on CookingVideo {
  String get videoId {
    if (youtubeUrl == null || youtubeUrl!.isEmpty) return '';
    
    // Improved regex to handle shorts, watch?v=, youtu.be, etc.
    final regExp = RegExp(
      r'^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|shorts\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
      caseSensitive: false,
      multiLine: false,
    );
    
    final match = regExp.firstMatch(youtubeUrl!);
    if (match != null && match.groupCount >= 1) {
      return match.group(1)!;
    }
    
    return '';
  }

  String get thumbnailUrl =>
      'https://img.youtube.com/vi/$videoId/maxresdefault.jpg';
  
  String get mqThumbnailUrl =>
      'https://img.youtube.com/vi/$videoId/mqdefault.jpg';
}
