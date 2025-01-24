import 'package:flutter/material.dart';
import 'package:gastbook/widgets/post_tile.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/post_provider.dart';
import '../models/post.dart';
import '../widgets/custom_drawer.dart';
import '../widgets/sidebar.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({Key? key}) : super(key: key);

  @override
  _FeedScreenState createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final TextEditingController _postController = TextEditingController();
  bool _isLoading = false;

  Future<void> _addPost(BuildContext bottomSheetContext) async {
    if (_postController.text.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;

    try {
      final postProvider = Provider.of<PostProvider>(context, listen: false);
      await postProvider.addPost(_postController.text.trim(), user!.id, user.fullName);

      _postController.clear(); // Maak het invoerveld leeg na het posten
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
    // final authProvider = Provider.of<AuthProvider>(context);
    final postProvider = Provider.of<PostProvider>(context);
    // final user = authProvider.user;

    double screenWidth = MediaQuery.of(context).size.width;
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
                  Expanded(
                    child: StreamBuilder<List<Post>>(
                      stream: postProvider.posts,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }

                        if (snapshot.hasError) {
                          return Center(child: Text('Error: ${snapshot.error}'));
                        }

                        if (!snapshot.hasData || snapshot.data!.isEmpty) {
                          return const Center(child: Text('No posts available.'));
                        }

                        final posts = snapshot.data!;
                        return ListView.builder(
                          itemCount: posts.length,
                          itemBuilder: (context, index) {
                            final post = posts[index];

                            return Center(
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(maxWidth: 750),
                                child: PostTile(post),
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
