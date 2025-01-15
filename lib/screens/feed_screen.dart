import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:gastbook/widgets/custom_drawer.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/sidebar.dart';
import 'package:timeago/timeago.dart' as timeago;

class FeedScreen extends StatefulWidget {
  const FeedScreen({Key? key}) : super(key: key);

  @override
  _FeedScreenState createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final TextEditingController _postController = TextEditingController();
  bool _isLoading = false;
  bool _showOwnPostsOnly = false;

  // Functie om een nieuwe post toe te voegen
  Future<void> _addPost(BuildContext bottomSheetContext) async {
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
        'userName': authProvider.userData?['fullName'] ?? 'Anonymous',
        'timestamp': FieldValue.serverTimestamp(),
      });

      _postController.clear(); // Maak het invoerveld leeg na het posten

      // Sluit de BottomSheet na het posten
      Navigator.pop(bottomSheetContext); // Sluit de BottomSheet
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

  // BottomSheet openen
  void _openPostBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[50],
      builder: (BuildContext bottomSheetContext) {
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              TextField(
                controller: _postController,
                decoration: const InputDecoration(
                  hintText: 'What\'s on your mind?',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 8),
              _isLoading
                  ? const CircularProgressIndicator()
                  : ElevatedButton(
                      onPressed: () => _addPost(bottomSheetContext),
                      child: const Text('Post'),
                    ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userId = authProvider.user?.uid;

    double screenWidth = MediaQuery.of(context).size.width;

    // Maak een GlobalKey voor de Scaffold
    final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.grey[50],
      resizeToAvoidBottomInset: true,
      appBar: screenWidth < 600
          ? AppBar(
              title: const Text("Gastbook"),
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
              leading: IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () {
                  _scaffoldKey.currentState?.openDrawer();
                },
              ),
            )
          : null,
      drawer: screenWidth < 600 ? const CustomDrawer() : null,
      body: Row(
        children: [
          if (screenWidth >= 600) const Sidebar(),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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

                  // Berichten weergeven
                  Expanded(
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('posts')
                          .where('userId', isEqualTo: _showOwnPostsOnly ? userId : null)
                          .orderBy('timestamp', descending: true)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }

                        if (snapshot.hasError) {
                          return Center(child: Text('Error: ${snapshot.error}'));
                        }

                        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                          return const Center(child: Text('No posts available.'));
                        }

                        final posts = snapshot.data!.docs;
                        return ListView.builder(
                          itemCount: posts.length,
                          itemBuilder: (context, index) {
                            final post = posts[index];
                            return Center(
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(
                                  maxWidth: 750,
                                ),
                                child: Card(
                                  margin: const EdgeInsets.symmetric(vertical: 8),
                                  color: Colors.white,
                                  child: Padding(
                                    padding: const EdgeInsets.all(0.0),
                                    child: ListTile(
                                      contentPadding: EdgeInsets.fromLTRB(25, 12, 25, 10),
                                      title: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              CircleAvatar(
                                                radius: 16,
                                                child: Icon(
                                                  Icons.person,
                                                  size: 18,
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    post['userName'],
                                                    style: TextStyle(
                                                      color: Theme.of(context).primaryColor,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  Text(
                                                    post['timestamp'] != null
                                                        ? timeago.format(
                                                            (post['timestamp'] as Timestamp)
                                                                .toDate())
                                                        : 'Unknown time',
                                                    style: const TextStyle(
                                                        fontSize: 12, color: Colors.grey),
                                                  ),
                                                ],
                                              )
                                            ],
                                          ),
                                        ],
                                      ),
                                      subtitle: Padding(
                                        padding: const EdgeInsets.only(top: 12),
                                        child: Text(
                                          post['text'],
                                          style: TextStyle(fontSize: 15),
                                        ),
                                      ),
                                    ),
                                  ),
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
      // Action button onderaan het scherm
      floatingActionButton: FloatingActionButton(
        onPressed: _openPostBottomSheet,
        backgroundColor: Theme.of(context).primaryColor,
        child: const Icon(
          Icons.add,
          color: Colors.white,
        ),
      ),
    );
  }
}
