import 'package:freezed_annotation/freezed_annotation.dart';
import '../constants/enums.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
abstract class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
    String? phoneWa,
    String? avatarUrl,
    String? googleId,
    @Default(UserRole.user) UserRole role,
    @Default(true) bool isActive,
    DateTime? emailVerifiedAt,
    String? fcmToken,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
