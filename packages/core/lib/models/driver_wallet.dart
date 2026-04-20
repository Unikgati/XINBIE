/// Driver wallet and transaction models for the financial system.

class DriverWallet {
  final String id;
  final int balance;
  final List<DriverTransaction> transactions;

  DriverWallet({required this.id, required this.balance, this.transactions = const []});

  factory DriverWallet.fromJson(Map<String, dynamic> json) => DriverWallet(
    id: json['id'] ?? '',
    balance: json['balance'] ?? 0,
    transactions: (json['transactions'] as List?)?.map((t) => DriverTransaction.fromJson(t)).toList() ?? [],
  );
}

class DriverTransaction {
  final String id;
  final String type; // COMMISSION, BONUS, WITHDRAWAL, PENALTY, COD_SETTLEMENT
  final int amount;
  final int balance;
  final String? note;
  final String? status; // PENDING, APPROVED, REJECTED, COMPLETED (withdrawal only)
  final String? orderId;
  final DateTime createdAt;

  DriverTransaction({
    required this.id, required this.type, required this.amount,
    required this.balance, this.note, this.status, this.orderId,
    required this.createdAt,
  });

  factory DriverTransaction.fromJson(Map<String, dynamic> json) => DriverTransaction(
    id: json['id'] ?? '',
    type: json['type'] ?? '',
    amount: json['amount'] ?? 0,
    balance: json['balance'] ?? 0,
    note: json['note'],
    status: json['status'],
    orderId: json['orderId'],
    createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
  );

  bool get isIncome => amount > 0;
  
  String get typeLabel => switch (type) {
    'COMMISSION' => 'Komisi',
    'BONUS' => 'Bonus',
    'WITHDRAWAL' => 'Penarikan',
    'PENALTY' => 'Penalti',
    'COD_SETTLEMENT' => 'Setoran COD',
    _ => type,
  };

  String get typeIcon => switch (type) {
    'COMMISSION' => '💰',
    'BONUS' => '🎁',
    'WITHDRAWAL' => '🏧',
    'PENALTY' => '⚠️',
    'COD_SETTLEMENT' => '💵',
    _ => '📋',
  };
}

class DriverEarnings {
  final int balance;
  final int totalEarnings;
  final int todayEarnings;
  final int todayOrders;
  final int weekEarnings;
  final int weekOrders;
  final int totalOrders;
  final List<DriverTransaction> transactions;

  DriverEarnings({
    required this.balance, required this.totalEarnings,
    required this.todayEarnings, required this.todayOrders,
    required this.weekEarnings, required this.weekOrders,
    required this.totalOrders, this.transactions = const [],
  });

  factory DriverEarnings.fromJson(Map<String, dynamic> json) => DriverEarnings(
    balance: json['balance'] ?? 0,
    totalEarnings: json['totalEarnings'] ?? 0,
    todayEarnings: json['todayEarnings'] ?? 0,
    todayOrders: json['todayOrders'] ?? 0,
    weekEarnings: json['weekEarnings'] ?? 0,
    weekOrders: json['weekOrders'] ?? 0,
    totalOrders: json['totalOrders'] ?? 0,
    transactions: (json['transactions'] as List?)?.map((t) => DriverTransaction.fromJson(t)).toList() ?? [],
  );
}

class BankInfo {
  final String? bankName;
  final String? accountNumber;
  final String? accountHolder;
  final String? vehicleType;
  final String? vehiclePlate;

  BankInfo({this.bankName, this.accountNumber, this.accountHolder, this.vehicleType, this.vehiclePlate});

  factory BankInfo.fromJson(Map<String, dynamic> json) => BankInfo(
    bankName: json['bankName'],
    accountNumber: json['accountNumber'],
    accountHolder: json['accountHolder'],
    vehicleType: json['vehicleType'],
    vehiclePlate: json['vehiclePlate'],
  );

  bool get isComplete => bankName != null && bankName!.isNotEmpty && accountNumber != null && accountNumber!.isNotEmpty;
}
