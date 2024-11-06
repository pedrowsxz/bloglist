const Blog = require('../models/blog')

const initialBlogs = [
  {
    'title': 'first test post',
    'author': 'first test author',
    'url': 'firsttest.com.test',
    'likes': 10
  },
  {
    'title': 'second test post',
    'author': 'second test author',
    'url': 'secondtest.com.test',
    'likes': 20
  },
]

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

module.exports = {
  initialBlogs, blogsInDb
}