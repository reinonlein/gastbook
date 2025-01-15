import 'package:flutter/material.dart';
import 'package:gastbook/screens/feed_screen.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'register_screen.dart'; // Importeer de register screen

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  String _errorMessage = ''; // Variabele voor het opslaan van de foutmelding

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gastbook'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
      ),
      backgroundColor: Colors.grey[50],
      resizeToAvoidBottomInset: true,
      body: SingleChildScrollView(
        child: Align(
          alignment: Alignment.topCenter,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 150.0),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: 350,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Email TextField met een vaste breedte
                  SizedBox(
                    child: TextField(
                      controller: _emailController,
                      decoration: const InputDecoration(labelText: 'Email'),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Password TextField met een vaste breedte
                  SizedBox(
                    child: TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Password'),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Toon de foutmelding als er een is
                  if (_errorMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: Text(
                        _errorMessage,
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 12.0,
                        ),
                      ),
                    ),

                  // Loading indicator of de login knop
                  _isLoading
                      ? const CircularProgressIndicator()
                      : SizedBox(
                          width: 220, // Knop ook met vaste breedte van 300 pixels
                          child: ElevatedButton(
                            onPressed: () async {
                              setState(() {
                                _isLoading = true;
                                _errorMessage =
                                    ''; // Reset de foutmelding voordat je probeert in te loggen
                              });
                              try {
                                await authProvider.signInWithEmailAndPassword(
                                  _emailController.text.trim(),
                                  _passwordController.text.trim(),
                                );
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const FeedScreen(),
                                  ),
                                );
                              } catch (e) {
                                // Algemene foutmelding voor login-problemen
                                setState(() {
                                  _errorMessage =
                                      'Could not log in with these credentials. Please try again!';
                                });
                              } finally {
                                setState(() {
                                  _isLoading = false;
                                });
                              }
                            },
                            child: const Text('Login'),
                          ),
                        ),
                  const SizedBox(height: 16),

                  // Register knop onder de login knop
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account? "),
                      TextButton(
                        onPressed: () {
                          // Navigeren naar het registratie-scherm
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const RegisterScreen()),
                          );
                        },
                        child: const Text('Register'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
