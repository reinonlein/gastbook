import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'feed_screen.dart'; // Zorg ervoor dat je de juiste feed_screen importeert

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _displayNameController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: Align(
        alignment: Alignment
            .topCenter, // Plaatst het formulier naar boven, maar in het midden van het scherm
        child: Padding(
          padding: const EdgeInsets.symmetric(
              horizontal: 16.0, vertical: 150.0), // Verhoog verticale padding
          child: Column(
            mainAxisSize:
                MainAxisSize.min, // Zorgt ervoor dat de column niet meer ruimte gebruikt dan nodig
            children: [
              // Display Name TextField met een vaste breedte
              Container(
                width: 300, // Vaste breedte van 300 pixels
                child: TextField(
                  controller: _displayNameController,
                  decoration: const InputDecoration(labelText: 'Display Name'),
                ),
              ),
              const SizedBox(height: 16),

              // Email TextField met een vaste breedte
              Container(
                width: 300, // Vaste breedte van 300 pixels
                child: TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
              ),
              const SizedBox(height: 16),

              // Password TextField met een vaste breedte
              Container(
                width: 300, // Vaste breedte van 300 pixels
                child: TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password'),
                ),
              ),
              const SizedBox(height: 16),

              // Loading indicator of de registratieknop
              _isLoading
                  ? const CircularProgressIndicator()
                  : SizedBox(
                      width: 300, // Knop ook met vaste breedte van 300 pixels
                      child: ElevatedButton(
                        onPressed: () async {
                          setState(() {
                            _isLoading = true;
                          });
                          try {
                            await authProvider.registerUser(
                              _emailController.text.trim(),
                              _passwordController.text.trim(),
                              _displayNameController.text.trim(),
                            );
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const FeedScreen(),
                              ),
                            );
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(e.toString())),
                            );
                          } finally {
                            setState(() {
                              _isLoading = false;
                            });
                          }
                        },
                        child: const Text('Register'),
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
