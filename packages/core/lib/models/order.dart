import 'package:freezed_annotation/freezed_annotation.dart';
import '../constants/enums.dart';
import 'order_item.dart';

part 'order.freezed.dart';
part 'order.g.dart';

@freezed
abstract class Order with _$Order {
  const factory Order({
    required String id,
    required String code,
    required String userId,
    String? driverId,
    String? pickupPointId,
    required Map<String, dynamic> addressSnapshot,
    @Default(DeliveryType.regular) DeliveryType deliveryType,
    String? deliverySlotId,
    String? scheduledDate,
    required PaymentMethod paymentMethod,
    @Default(PaymentStatus.pending) PaymentStatus paymentStatus,
    @Default(OrderStatus.waitingPayment) OrderStatus orderStatus,
    required int subtotal,
    @Default(0) int deliveryFee,
    @Default(0) int discountAmount,
    required int grandTotal,
    String? midtransTransactionId,
    String? midtransPaymentType,
    Map<String, dynamic>? paymentDetails,
    String? proofPhotoUrl,
    String? notes,
    String? problemType,
    String? problemDescription,
    String? problemPhotoUrl,
    DateTime? problemResolvedAt,
    required DateTime createdAt,
    required DateTime updatedAt,
    // Joined
    List<OrderItem>? items,
    String? userName,
    String? driverName,
    String? driverPhoneWa,
  }) = _Order;

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}
