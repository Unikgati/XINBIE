import 'package:freezed_annotation/freezed_annotation.dart';

/// Enums matching database schema and business logic.

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum UserRole { user, driver, admin }

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum VerificationStatus { pending, approved, rejected }

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum OrderStatus {
  waitingPayment,
  received,
  processing,
  waitingDriver,
  inDelivery,
  delivered,
  completed,
  cancelled,
  problem,
}

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum PaymentMethod {
  qris,
  va, // Legacy fallback
  gopay,
  shopeepay,
  ovo,
  dana,
  vaBca,
  vaMandiri,
  vaBni,
  vaBri,
  vaPermata,
  vaCimb,
  alfamart,
  indomaret,
  cod,
}

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum PaymentStatus { pending, paid, failed, refunded }

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum DeliveryType { regular, instant }

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum BannerType { hero, promo }

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum BannerActionType { none, category, product, url }

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum PromoType { percent, nominal }

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum ProblemType {
  addressNotFound,
  recipientAbsent,
  recipientCannotPay,
  itemDamaged,
  vehicleProblem,
  other,
}

@JsonEnum(fieldRename: FieldRename.screamingSnake)
enum NotificationType {
  orderCreated,
  paymentSuccess,
  statusUpdate,
  driverAssigned,
  driverOnWay,
  orderCompleted,
  orderProblem,
  newOrder,
  driverApproved,
  driverRejected,
  broadcast,
}

extension OrderStatusX on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.waitingPayment:
        return 'Menunggu Pembayaran';
      case OrderStatus.received:
        return 'Pesanan Diterima';
      case OrderStatus.processing:
        return 'Sedang Diproses';
      case OrderStatus.waitingDriver:
        return 'Menunggu Driver';
      case OrderStatus.inDelivery:
        return 'Dalam Perjalanan';
      case OrderStatus.delivered:
        return 'Telah Diantar';
      case OrderStatus.completed:
        return 'Selesai';
      case OrderStatus.cancelled:
        return 'Dibatalkan';
      case OrderStatus.problem:
        return 'Ada Masalah';
    }
  }

  String get emoji {
    switch (this) {
      case OrderStatus.waitingPayment:
        return '🟡';
      case OrderStatus.received:
        return '🔵';
      case OrderStatus.processing:
        return '🟣';
      case OrderStatus.waitingDriver:
        return '🟠';
      case OrderStatus.inDelivery:
        return '🚚';
      case OrderStatus.delivered:
        return '📦';
      case OrderStatus.completed:
        return '✅';
      case OrderStatus.cancelled:
        return '❌';
      case OrderStatus.problem:
        return '⚠️';
    }
  }
}

extension ProblemTypeX on ProblemType {
  String get label {
    switch (this) {
      case ProblemType.addressNotFound:
        return 'Alamat tidak ditemukan';
      case ProblemType.recipientAbsent:
        return 'Penerima tidak ada di tempat';
      case ProblemType.recipientCannotPay:
        return 'Penerima tidak bisa bayar (COD)';
      case ProblemType.itemDamaged:
        return 'Barang rusak / tidak sesuai';
      case ProblemType.vehicleProblem:
        return 'Kendala kendaraan';
      case ProblemType.other:
        return 'Lainnya';
    }
  }

  String get emoji {
    switch (this) {
      case ProblemType.addressNotFound:
        return '🏠';
      case ProblemType.recipientAbsent:
        return '🚪';
      case ProblemType.recipientCannotPay:
        return '💵';
      case ProblemType.itemDamaged:
        return '📦';
      case ProblemType.vehicleProblem:
        return '🚗';
      case ProblemType.other:
        return '📝';
    }
  }
}
