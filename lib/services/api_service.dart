import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/tree_data.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:8000'; // 로컬 테스트용

  Future<bool> sendTreeData(TreeData data, {double? lat, double? lon}) async {
    try {
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
