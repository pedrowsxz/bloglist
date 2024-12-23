const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../utils/config')
const middleware = require('../utils/middleware')


blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
      response.json(blogs)
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const blog = request.body
  
  const user = request.user

  if (!user) {
    return response.status(403).json({ error: 'user missing' })
  }

  if (!blog.title || !blog.url) {
    return  response.status(400).json({ error: 'title or url missing' })
    } 
  const newBlog = new Blog(
    {
      title: blog.title,
      author: blog.author,
      url: blog.url,
      likes: blog.likes,
      user: user.id
    }
)

  const savedBlog = await newBlog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {

  const blog = await Blog.findById(request.params.id)
  const user = request.user

  if (blog.user.toString() === user.id.toString()) {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } else {
    return response.status(403).json({ error: 'you do not have permission to delete this blog' })
  }
})

blogsRouter.put('/:id', middleware.userExtractor, async (request, response) => {
  const blog =  {
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.json(updatedBlog)
})

module.exports = blogsRouter