import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/tree_data.dart';

class ApiService {
  static const String defaultUrl = 'http://172.30.1.90:8000'; // 기본값 (사용자 PC IP)

  Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('server_url') ?? defaultUrl;
  }

  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_url', url);
  }

  Future<bool> sendTreeData(TreeData data, {double? lat, double? lon}) async {
    try {
      final baseUrl = await getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/measurements'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode({
          ...data.toJson(),
          'latitude': lat,
          'longitude': lon,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('Data sent successfully: ${response.body}');
        return true;
      } else {
        print('Failed to send data: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('Error sending data: $e');
      return false;
    }
  }
}
