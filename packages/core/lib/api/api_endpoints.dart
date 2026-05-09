/// All API endpoint paths in one place.
class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String google = '/auth/google';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendOtp = '/auth/resend-otp';
  static const String forgotPassword = '/auth/forgot-password';
  static const String verifyResetOtp = '/auth/verify-reset-otp';
  static const String resetPassword = '/auth/reset-password';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String profile = '/auth/profile';
  static const String fcmToken = '/auth/fcm-token';

  // Products & Categories
  static const String categories = '/categories';
  static const String products = '/products';
  static String product(String id) => '/products/$id';
  static const String banners = '/banners';
  static const String cookingVideos = '/cooking-videos';
  static const String flashSales = '/flash-sales';
  static const String recipes = '/recipes';
  static String recipe(String idOrSlug) => '/recipes/$idOrSlug';

  // Cart
  static const String cartValidate = '/cart/validate';

  // Addresses
  static const String addresses = '/addresses';
  static String address(String id) => '/addresses/$id';
  static String addressSetPrimary(String id) => '/addresses/$id/set-primary';

  // Regions (Wilayah)
  static const String provinces = '/regions/provinces';
  static String cities(String provinceId) => '/regions/cities?provinceId=$provinceId';
  static String districts(String cityId) => '/regions/districts?cityId=$cityId';
  static String villages(String districtId) => '/regions/villages?districtId=$districtId';

  // Delivery
  static const String deliverySlots = '/delivery/slots';
  static const String deliveryOptions = '/delivery/options';
  static const String deliveryAreas = '/delivery/areas';

  // Promo
  static const String promoValidate = '/promos/validate';
  static const String promosAvailable = '/promos/available';

  // Orders
  static const String orders = '/orders';
  static String order(String id) => '/orders/$id';
  static String orderCancel(String id) => '/orders/$id/cancel';
  static String paymentStatus(String id) => '/orders/$id/payment-status';
  static const String paymentWebhook = '/payment/webhook';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const String notificationsReadAll = '/notifications/read-all';

  // Driver
  static const String driverRegister = '/driver/register';
  static const String driverUploadKtp = '/driver/upload-ktp';
  static const String driverVerificationStatus = '/driver/verification-status';
  static const String driverOnlineStatus = '/driver/online-status';
  static const String driverLocation = '/driver/location';
  static const String driverOrdersActive = '/driver/orders/active';
  static const String driverOrdersHistory = '/driver/orders/history';
  static String driverOrderAccept(String id) => '/driver/orders/$id/accept';
  static String driverOrderReject(String id) => '/driver/orders/$id/reject';
  static String driverOrderStatus(String id) => '/driver/orders/$id/status';
  static String driverOrderProof(String id) => '/driver/orders/$id/proof';
  static String driverOrderProblem(String id) => '/driver/orders/$id/problem';
  static String driverOrderCodConfirm(String id) =>
      '/driver/orders/$id/cod-confirm';
  static const String driverEarnings = '/driver/earnings';
  static const String driverWallet = '/driver/wallet';
  static const String driverWithdrawal = '/driver/withdrawal';
  static const String driverBank = '/driver/bank';

  // Geocoding
  static const String geocodeReverse = '/geocode/reverse';
  static const String geocodeSearch = '/geocode/search';
}
