import 'package:flutter/material.dart';
import 'package:gastbook/models/post.dart';
import 'package:gastbook/providers/post_provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:gastbook/providers/auth_provider.dart';
import 'package:gastbook/screens/profile_screen.dart';
import 'package:provider/provider.dart';

class PostTile extends StatelessWidget {
  final Post post;

  const PostTile(this.post, {super.key});

  @override
  Widget build(BuildContext context) {
    final TextEditingController _commentController = TextEditingController();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final postProvider = Provider.of<PostProvider>(context, listen: false);
    final user = authProvider.user;

    final isLiked = post.likes.any((like) => like['userId'] == user!.id);
    final likeCount = post.likes.length;
    final commentCount = post.comments.length;

    Future<void> _addComment(Post post) async {
      if (_commentController.text.isEmpty) return;

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;

      try {
        final postProvider = Provider.of<PostProvider>(context, listen: false);
        await postProvider.addComment(
          post.postId,
          user!.id,
          user.fullName,
          '',
          _commentController.text.trim(),
        );
        _commentController.clear(); // Maak het comment invoerveld leeg
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding comment: $e')),
        );
      }
    }

    // return Text(post.fullName);
    return Card(
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
                    backgroundImage:
                        post.profileImage != '' ? NetworkImage(post.profileImage) : null,
                    child: post.profileImage == '' ? const Icon(Icons.person, size: 18) : null,
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
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
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
                              isLiked ? Icons.favorite : Icons.favorite_border,
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
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                      Text(
                        '$commentCount ${commentCount == 1 ? 'Comment' : 'Comments'}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
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
                              padding: const EdgeInsets.only(bottom: 14),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(0, 5, 12, 0),
                                    child: const CircleAvatar(
                                      radius: 14,
                                      child: Icon(Icons.person, size: 18),
                                    ),
                                  ),
                                  Container(
                                    padding:
                                        const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: Colors.grey[50],
                                      borderRadius: BorderRadius.circular(15.0),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          comment['fullName'],
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                            letterSpacing: 0.7,
                                            color: Theme.of(context).primaryColor,
                                          ),
                                        ),
                                        const SizedBox(height: 4.0),
                                        Text(
                                          comment['content'],
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(0, 5, 12, 0),
                                  child: const CircleAvatar(
                                    radius: 14,
                                    child: Icon(Icons.person, size: 18),
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    padding:
                                        const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: Colors.grey[50],
                                      borderRadius: BorderRadius.circular(15.0),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const SizedBox(height: 4.0),
                                        TextField(
                                          controller: _commentController,
                                          decoration: InputDecoration(
                                            hintText: 'Comment as ${user?.fullName}',
                                            hintStyle: TextStyle(color: Colors.grey),
                                            border: InputBorder.none,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  width: 10,
                                ),
                                ElevatedButton(
                                    onPressed: () => _addComment(post), child: Text('Add'))
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
    );
  }
}
