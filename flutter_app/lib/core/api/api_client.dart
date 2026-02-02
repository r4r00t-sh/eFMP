import 'package:dio/dio.dart';
import 'package:efiling_app/core/api/api_config.dart';

/// HTTP client for EFMP API. Matches frontend: baseURL + Bearer token.
class ApiClient {
  ApiClient._() {
    _initDio();
  }

  void _initDio() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await ApiConfig.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) {
        if (e.response?.statusCode == 401) {
          ApiConfig.onUnauthorized?.call();
        }
        return handler.next(e);
      },
    ));
  }

  /// Call after changing ApiConfig base URL (e.g. user set Server URL on phone).
  void reset() {
    _initDio();
  }

  static final ApiClient _instance = ApiClient._();
  factory ApiClient() => _instance;

  late Dio _dio;
  Dio get dio => _dio;

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters, Options? options}) {
    return _dio.get<T>(path, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> post<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters, Options? options}) {
    return _dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> put<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters, Options? options}) {
    return _dio.put<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> patch<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters, Options? options}) {
    return _dio.patch<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> delete<T>(String path, {dynamic data, Options? options}) {
    return _dio.delete<T>(path, data: data, options: options);
  }
}

/// File download for attachments (optional progress).
Future<void> downloadFile(String url, String savePath, {void Function(int, int)? onProgress}) async {
  final dio = ApiClient().dio;
  await dio.download(url, savePath, onReceiveProgress: onProgress);
}
