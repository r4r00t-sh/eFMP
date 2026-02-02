import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/api/api_config.dart';
import 'package:efiling_app/models/user_model.dart';

/// Result of login: success, or failure with optional message for the user.
class LoginResult {
  final bool success;
  final String? errorMessage;
  const LoginResult(this.success, [this.errorMessage]);
}

/// Auth state matching frontend zustand store (user + token).
class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _token;

  AuthProvider() {
    ApiConfig.onUnauthorized = () => logout();
  }

  UserModel? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _user != null && _token != null;

  /// Refetch current user (e.g. after profile/avatar update).
  Future<void> refreshUser() async {
    if (_user?.id == null) return;
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/auth/profile');
      final data = res.data;
      if (data != null && data['id'] != null) {
        _user = UserModel.fromJson(Map<String, dynamic>.from(data));
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> loadStoredAuth() async {
    final t = await ApiConfig.getToken();
    if (t == null || t.isEmpty) {
      _user = null;
      _token = null;
      notifyListeners();
      return;
    }
    _token = t;
    try {
      final res = await ApiClient().get<Map<String, dynamic>>('/auth/profile');
      final data = res.data;
      if (data != null && data['id'] != null) {
        _user = UserModel.fromJson(Map<String, dynamic>.from(data));
        notifyListeners();
        return;
      }
    } catch (_) {
      await ApiConfig.clearToken();
    }
    _user = null;
    _token = null;
    notifyListeners();
  }

  /// Returns [LoginResult]. Use [LoginResult.errorMessage] to show user-friendly message (connection vs invalid credentials).
  Future<LoginResult> login(String username, String password) async {
    try {
      final res = await ApiClient().post<Map<String, dynamic>>('/auth/login', data: {
        'username': username,
        'password': password,
      });
      final data = res.data;
      if (data == null) return const LoginResult(false, 'Invalid username or password');
      final u = data['user'];
      final accessToken = data['access_token'] as String?;
      if (u == null || accessToken == null) return const LoginResult(false, 'Invalid username or password');
      _user = UserModel.fromJson(Map<String, dynamic>.from(u as Map));
      _token = accessToken;
      await ApiConfig.setToken(accessToken);
      notifyListeners();
      return const LoginResult(true);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        return LoginResult(
          false,
          'Cannot reach server (tried: ${ApiConfig.baseUrl}). Same Wi‑Fi? Backend running on PC? Clear app data if you changed Server URL in Settings.',
        );
      }
      final status = e.response?.statusCode;
      final body = e.response?.data;
      final msg = body is Map ? (body['message'] ?? body['error'])?.toString() : null;
      if (status == 401 || (msg != null && msg.toLowerCase().contains('invalid'))) {
        return const LoginResult(false, 'Invalid username or password');
      }
      return LoginResult(false, msg ?? 'Login failed (${e.response?.statusCode ?? e.type})');
    } catch (e) {
      return LoginResult(false, 'Login failed: ${e.toString().replaceFirst(RegExp(r'^Exception:?\s*'), '')}');
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    await ApiConfig.clearToken();
    try {
      await ApiClient().post('/auth/logout');
    } catch (_) {}
    notifyListeners();
  }

  void setAuth(UserModel u, String t) {
    _user = u;
    _token = t;
    ApiConfig.setToken(t);
    notifyListeners();
  }
}
