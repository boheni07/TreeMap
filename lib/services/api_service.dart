import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/tree_data.dart';

class ApiService {
  static const String defaultUrl = 'http://172.30.1.90:8000'; // 기본값 (사용자 PC IP)
  static const Duration timeout = Duration(seconds: 10);
  static const int maxRetries = 3;

  Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('server_url') ?? defaultUrl;
  }

  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_url', url);
  }

  Future<bool> sendTreeData(
    TreeData data, {
    double? deviceLat,
    double? deviceLon,
    double? treeLat,
    double? treeLon,
  }) async {
    int retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        final baseUrl = await getBaseUrl();
        final response = await http
            .post(
              Uri.parse('$baseUrl/api/measurements'),
              headers: <String, String>{
                'Content-Type': 'application/json; charset=UTF-8',
              },
              body: jsonEncode({
                ...data.toJson(),
                if (deviceLat != null) 'deviceLatitude': deviceLat,
                if (deviceLon != null) 'deviceLongitude': deviceLon,
                if (treeLat != null) 'treeLatitude': treeLat,
                if (treeLon != null) 'treeLongitude': treeLon,
              }),
            )
            .timeout(timeout);

        if (response.statusCode == 200 || response.statusCode == 201) {
          print('Data sent successfully: ${response.body}');
          return true;
        } else {
          print('Failed to send data: ${response.statusCode} - ${response.body}');
          return false;
        }
      } on SocketException catch (e) {
        print('Network error (attempt ${retryCount + 1}/$maxRetries): $e');
        retryCount++;
        if (retryCount >= maxRetries) {
          print('Max retries reached. Failed to send data.');
          return false;
        }
        await Future.delayed(Duration(seconds: retryCount)); // 지수 백오프
      } on http.ClientException catch (e) {
        print('HTTP client error: $e');
        return false;
      } on FormatException catch (e) {
        print('Invalid response format: $e');
        return false;
      } catch (e) {
        print('Unexpected error sending data: $e');
        return false;
      }
    }
    
    return false;
  }

  /// 서버 연결 테스트
  Future<bool> testConnection() async {
    try {
      final baseUrl = await getBaseUrl();
      final response = await http
          .get(Uri.parse('$baseUrl/'))
          .timeout(timeout);
      
      return response.statusCode == 200;
    } catch (e) {
      print('Connection test failed: $e');
      return false;
    }
  }
}

