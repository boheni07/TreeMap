import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _urlController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final url = await _apiService.getBaseUrl();
    setState(() {
      _urlController.text = url;
      _isLoading = false;
    });
  }

  Future<void> _saveSettings() async {
    await _apiService.setBaseUrl(_urlController.text);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('설정이 저장되었습니다.')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('서버 연결 설정'),
        backgroundColor: Colors.green,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '서버 주소 (FastAPI)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _urlController,
                    decoration: const InputDecoration(
                      hintText: 'http://172.30.1.90:8000',
                      border: OutlineInputBorder(),
                      helperText: 'Vercel 배포 주소 또는 PC IP를 입력하세요.',
                    ),
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _saveSettings,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('저장하기', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
