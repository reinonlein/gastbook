import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../providers/auth_provider.dart';
import '../providers/post_provider.dart';
import '../models/post.dart';
import '../widgets/custom_drawer.dart';
import '../widgets/sidebar.dart';
import 'profile_screen.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({Key? key}) : super(key: key);

  @override
  _FeedScreenState createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final TextEditingController _postController = TextEditingController();
  bool _isLoading = false;

  // Functie om een nieuwe post toe te voegen
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
    final authProvider = Provider.of<AuthProvider>(context);
    final postProvider = Provider.of<PostProvider>(context);
    final user = authProvider.user;

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
                            final isLiked = post.likes.any((like) => like['userId'] == user!.id);
                            final likeCount = post.likes.length;
                            final commentCount = post.comments.length;

                            return Center(
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(maxWidth: 750),
                                child: Card(
                                  margin: const EdgeInsets.symmetric(vertical: 8),
                                  color: Colors.white,
                                  child: Padding(
                                    padding: const EdgeInsets.all(0.0),
                                    child: ListTile(
                                      contentPadding: const EdgeInsets.fromLTRB(25, 12, 25, 0),
                                      title: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              CircleAvatar(
                                                radius: 16,
                                                backgroundImage: post.profileImage != ''
                                                    ? NetworkImage(post.profileImage)
                                                    : null,
                                                child: post.profileImage == ''
                                                    ? const Icon(Icons.person, size: 18)
                                                    : null,
                                              ),
                                              const SizedBox(width: 12),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  GestureDetector(
                                                    onTap: () {
                                                      Navigator.push(
                                                        context,
                                                        MaterialPageRoute(
                                                          builder: (context) => ProfileScreen(
                                                            userId: post.userId,
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                    child: Text(
                                                      post.fullName,
                                                      style: TextStyle(
                                                        color: Theme.of(context).primaryColor,
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ),
                                                  Text(
                                                    timeago.format(post.createdAt.toDate()),
                                                    style: const TextStyle(
                                                        fontSize: 12, color: Colors.grey),
                                                  ),
                                                ],
                                              )
                                            ],
                                          ),
                                        ],
                                      ),
                                      subtitle: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.fromLTRB(0, 25, 0, 12),
                                            child: Text(
                                              post.content,
                                              style: const TextStyle(fontSize: 15),
                                            ),
                                          ),
                                          Divider(
                                            thickness: 0.7,
                                            color: Colors.grey[200],
                                          ),
                                          Theme(
                                            data: ThemeData(
                                              dividerColor: Colors.transparent,
                                              hoverColor: Colors.transparent,
                                              splashColor: Colors.transparent,
                                              highlightColor: Colors.transparent,
                                            ),
                                            child: ExpansionTile(
                                              tilePadding: EdgeInsets.zero,
                                              trailing: SizedBox(),
                                              title: Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                                children: [
                                                  Row(
                                                    children: [
                                                      IconButton(
                                                        icon: Icon(
                                                          size: 17,
                                                          isLiked
                                                              ? Icons.favorite
                                                              : Icons.favorite_border,
                                                          color: isLiked ? Colors.red : Colors.grey,
                                                        ),
                                                        onPressed: () {
                                                          postProvider.toggleLike(
                                                            post.postId,
                                                            user!.id,
                                                            user.fullName,
                                                            user.profileImage,
                                                          );
                                                        },
                                                      ),
                                                      Text(
                                                        '$likeCount ${likeCount == 1 ? 'Like' : 'Likes'}',
                                                        style: const TextStyle(
                                                            fontSize: 12, color: Colors.grey),
                                                      ),
                                                    ],
                                                  ),
                                                  Text(
                                                    '$commentCount ${commentCount == 1 ? 'Comment' : 'Comments'}',
                                                    style: const TextStyle(
                                                        fontSize: 12, color: Colors.grey),
                                                  ),
                                                ],
                                              ),
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                                                  child: Column(
                                                    children: [
                                                      for (var comment in post.comments)
                                                        Padding(
                                                          padding:
                                                              const EdgeInsets.only(bottom: 14),
                                                          child: Row(
                                                            crossAxisAlignment:
                                                                CrossAxisAlignment.start,
                                                            children: [
                                                              Padding(
                                                                padding: const EdgeInsets.fromLTRB(
                                                                    0, 5, 12, 0),
                                                                child: const CircleAvatar(
                                                                  radius: 14,
                                                                  child:
                                                                      Icon(Icons.person, size: 18),
                                                                ),
                                                              ),
                                                              Container(
                                                                padding: const EdgeInsets.symmetric(
                                                                    horizontal: 15, vertical: 10),
                                                                decoration: BoxDecoration(
                                                                  color: Colors.grey[50],
                                                                  borderRadius:
                                                                      BorderRadius.circular(15.0),
                                                                ),
                                                                child: Column(
                                                                  crossAxisAlignment:
                                                                      CrossAxisAlignment.start,
                                                                  children: [
                                                                    Text(
                                                                      comment['fullName'],
                                                                      style: TextStyle(
                                                                        fontWeight: FontWeight.bold,
                                                                        fontSize: 12,
                                                                        letterSpacing: 0.7,
                                                                        color: Theme.of(context)
                                                                            .primaryColor,
                                                                      ),
                                                                    ),
                                                                    const SizedBox(height: 4.0),
                                                                    Text(
                                                                      comment['text'],
                                                                      style: const TextStyle(
                                                                        fontSize: 14.0,
                                                                        color: Colors.black87,
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      Padding(
                                                        padding: const EdgeInsets.only(bottom: 14),
                                                        child: Row(
                                                          crossAxisAlignment:
                                                              CrossAxisAlignment.start,
                                                          children: [
                                                            Padding(
                                                              padding: const EdgeInsets.fromLTRB(
                                                                  0, 5, 12, 0),
                                                              child: const CircleAvatar(
                                                                radius: 14,
                                                                child: Icon(Icons.person, size: 18),
                                                              ),
                                                            ),
                                                            Expanded(
                                                              child: Container(
                                                                padding: const EdgeInsets.symmetric(
                                                                    horizontal: 15, vertical: 10),
                                                                decoration: BoxDecoration(
                                                                  color: Colors.grey[50],
                                                                  borderRadius:
                                                                      BorderRadius.circular(15.0),
                                                                ),
                                                                child: Column(
                                                                  crossAxisAlignment:
                                                                      CrossAxisAlignment.start,
                                                                  children: [
                                                                    const SizedBox(height: 4.0),
                                                                    Text(
                                                                      'Comment as ${user?.fullName}',
                                                                      style: const TextStyle(
                                                                        fontSize: 14.0,
                                                                        color: Colors.grey,
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
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
