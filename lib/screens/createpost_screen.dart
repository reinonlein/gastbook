import 'package:flutter/material.dart';
import 'package:gastbook/widgets/custom_drawer.dart';
import 'package:gastbook/widgets/sidebar.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/post_provider.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({Key? key}) : super(key: key);

  @override
  _CreatePostScreenState createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final TextEditingController _postController = TextEditingController();
  bool _isLoading = false;

  Future<void> _addPost() async {
    if (_postController.text.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;

    try {
      final postProvider = Provider.of<PostProvider>(context, listen: false);
      await postProvider.addPost(_postController.text.trim(), user!.id, user.fullName);

      _postController.clear();
      Navigator.pop(context);
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
    double screenWidth = MediaQuery.of(context).size.width;
    final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.grey[50],
      appBar: screenWidth < 600
          ? AppBar(
              title: const Text("Create Post"),
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.all(70.0),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: 750),
                    child: Card(
                      color: Colors.white,
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(30, 30, 30, 20),
                        width: double.infinity,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  child: Icon(Icons.person, size: 18),
                                ),
                                SizedBox(
                                  width: 15,
                                ),
                                Text(
                                  user!.fullName,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Theme.of(context).primaryColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 18),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.grey[50],
                                borderRadius: BorderRadius.circular(15.0),
                              ),
                              child: TextField(
                                controller: _postController,
                                decoration: InputDecoration(
                                  hintText: "What's on your mind?",
                                  hintStyle: TextStyle(color: Colors.grey),
                                  border: InputBorder.none,
                                ),
                                maxLines: 3,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 100,
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.pop(context);
                                    },
                                    style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.grey[100],
                                        foregroundColor: Colors.grey[500]),
                                    child: Text('Cancel'),
                                  ),
                                ),
                                SizedBox(width: 25),
                                SizedBox(
                                  width: 100,
                                  child: _isLoading
                                      ? const CircularProgressIndicator()
                                      : ElevatedButton(
                                          onPressed: _addPost,
                                          style: ElevatedButton.styleFrom(
                                              backgroundColor: Theme.of(context).primaryColor,
                                              foregroundColor: Colors.white),
                                          child: const Text('Post'),
                                        ),
                                ),
                              ],
                            )
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
