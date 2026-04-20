import 'package:freezed_annotation/freezed_annotation.dart';
import '../constants/enums.dart';

part 'driver_profile.freezed.dart';
part 'driver_profile.g.dart';

@freezed
abstract class DriverProfile with _$DriverProfile {
  const factory DriverProfile({
    required String id,
    required String userId,
    String? ktpPhotoUrl,
    @Default(VerificationStatus.pending)
    VerificationStatus verificationStatus,
    DateTime? verifiedAt,
    String? verifiedBy,
    String? rejectionReason,
    @Default(0.0) double ratingAvg,
    @Default(0) int totalOrdersDone,
    @Default(false) bool isOnline,
    double? lastLat,
    double? lastLng,
    DateTime? lastLocationAt,
    required DateTime createdAt,
    // Joined
    String? userName,
    String? userEmail,
    String? userPhoneWa,
    String? userAvatarUrl,
  }) = _DriverProfile;

  factory DriverProfile.fromJson(Map<String, dynamic> json) =>
      _$DriverProfileFromJson(json);
}
