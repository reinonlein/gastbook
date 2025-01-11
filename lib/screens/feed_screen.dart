import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:gastbook/widgets/custom_drawer.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/sidebar.dart'; // Zorg ervoor dat je de juiste sidebar import hebt

class FeedScreen extends StatefulWidget {
  const FeedScreen({Key? key}) : super(key: key);

  @override
  _FeedScreenState createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final TextEditingController _postController = TextEditingController();
  bool _isLoading = false;
  bool _showOwnPostsOnly = false; // Nieuwe variabele voor het filteren van berichten

  // Functie om een nieuwe post toe te voegen
  Future<void> _addPost() async {
    if (_postController.text.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;

    try {
      // Voeg de post toe aan Firestore
      await FirebaseFirestore.instance.collection('posts').add({
        'text': _postController.text.trim(),
        'userId': user!.uid,
        'userName': authProvider.userData?['name'] ?? 'Anonymous',
        'timestamp': FieldValue.serverTimestamp(),
      });

      _postController.clear(); // Maak het invoerveld leeg na het posten
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding post: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userId = authProvider.user?.uid;

    double screenWidth = MediaQuery.of(context).size.width;

    // Maak een GlobalKey voor de Scaffold
    final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      // Voeg de GlobalKey toe aan de Scaffold
      key: _scaffoldKey,
      // AppBar wordt alleen weergegeven als het scherm kleiner is dan 600px
      appBar: screenWidth < 600
          ? AppBar(
              title: const Text("Gastbook"),
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
              leading: IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () {
                  // Gebruik de GlobalKey om de Drawer te openen
                  _scaffoldKey.currentState?.openDrawer();
                },
              ),
            )
          : null, // Geen AppBar op grotere schermen
      // De Drawer die verschijnt op kleinere schermen
      drawer: screenWidth < 600 ? const CustomDrawer() : null, // Geen Drawer op grotere schermen
      // De body layout
      body: Row(
        children: [
          if (screenWidth >= 600) const Sidebar(), // Sidebar alleen op grote schermen
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Bericht plaatsen sectie
                  TextField(
                    controller: _postController,
                    decoration: const InputDecoration(
                      hintText: 'What\'s on your mind?',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 8),
                  _isLoading
                      ? const CircularProgressIndicator()
                      : ElevatedButton(
                          onPressed: _addPost,
                          child: const Text('Post'),
                        ),
                  const SizedBox(height: 16),

                  // Toggle voor "Alle berichten" of "Mijn berichten"
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      const Text("Show my posts only: "),
                      Switch(
                        value: _showOwnPostsOnly,
                        onChanged: (value) {
                          setState(() {
                            _showOwnPostsOnly = value;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Berichten weergeven (alleen van de ingelogde gebruiker of van iedereen)
                  Expanded(
                    child: StreamBuilder<QuerySnapshot>(
                      // Voeg een filter toe voor de berichten van de ingelogde gebruiker
                      stream: FirebaseFirestore.instance
                          .collection('posts')
                          .where('userId',
                              isEqualTo: _showOwnPostsOnly
                                  ? userId
                                  : null) // Filter op userId wanneer nodig
                          .orderBy('timestamp', descending: true)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }

                        if (snapshot.hasError) {
                          return Center(
                            child: Text('Error: ${snapshot.error}'),
                          );
                        }

                        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                          return const Center(child: Text('No posts available.'));
                        }

                        // Posts weergeven
                        final posts = snapshot.data!.docs;
                        return ListView.builder(
                          itemCount: posts.length,
                          itemBuilder: (context, index) {
                            final post = posts[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 8),
                              child: ListTile(
                                title: Text(post['userName']),
                                subtitle: Text(post['text']),
                                trailing: Text(
                                  post['timestamp'] != null
                                      ? (post['timestamp'] as Timestamp).toDate().toString()
                                      : 'Unknown time',
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
