const { describe, test, after, beforeEach } = require('node:test')
const assert = require('node:assert')

const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const mongoose = require('mongoose')

const helper = require('./test_helper')
const Blog = require('../models/blog')


beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('GET requests to already existing blogs'), () => {
  test('returns the correct amount of blog posts in the JSON format', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('unique identifier property of the blog posts is named id not _id', async () => {
    const response = await api.get('/api/blogs')

    const blog = response.body[0]
    assert(blog.id)
    assert.strictEqual(blog._id, undefined)
  })
}

describe('POST requests to already existing blogs'), () => {
  test('POST request successfully creates a new blog post', async () => {
    const newBlog = {
      'title': 'third test post',
      'author': 'thirdtest author',
      'url': 'thirdtest.com.test',
      'likes': 30
    }

    await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const response = await helper.blogsInDb()
    const titles = response.map(r => r.title)

    assert.strictEqual(response.length, helper.initialBlogs.length + 1)
    assert(titles.includes('third test post'))
  })

  test('if likes property is missing from the request, it will default to the value 0', async () => {
    const newBlog = {
      'title': 'fourth test post',
      'author': 'fourth author',
      'url': 'fourthtest.com.test',
    }

    const responsePOST = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)

    const responseGET = await api.get('/api/blogs')
    const likes = responseGET.body.map(r => r.likes)

    assert.strictEqual(responsePOST.body.likes, 0)
    assert.strictEqual(responseGET.body.length, helper.initialBlogs.length + 1)
    assert(likes.includes(0))
  })

  test('if title or url properties are missing from the request data, responds with status code 400 Bad Request', async () => {
    const newBlogWithoutTitle = {
      author: 'fifth author',
      url: 'fifthtest.com.test',
      likes: 50
    }

    const newBlogWithoutURL = {
      title: 'sixth test post',
      author: 'sixth author',
      likes: 60
    }

    await api
      .post('/api/blogs')
      .send(newBlogWithoutTitle)
      .expect(400)

    await api
      .post('/api/blogs')
      .send(newBlogWithoutURL)
      .expect(400)

    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })
}

describe('DELETE request to a single blog in an already populated database', () => {
  test('a blog can be deleted', async () => {
    const blogsBeforeDeletion = await helper.blogsInDb()
    const blogToDelete = blogsBeforeDeletion[0]
  
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)
  
    const blogsAfterDeletion = await helper.blogsInDb()
    assert(!blogsAfterDeletion.includes(blogToDelete))
    assert.strictEqual(blogsAfterDeletion.length, helper.initialBlogs.length - 1)
  })
})

describe('PUT request', () => {
  test('updating the information of an individual blog post', async () => {

    const blogToUpdate = await Blog.findOne({});
    
    const updatedBlog = {
      title: 'seventh blog post',
      author: 'seventh author',
      url: 'seventhtest.com.test',
      likes: 70
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsDbAfterUpdate = await helper.blogsInDb()
    const blogThatWasUpdated = blogsDbAfterUpdate.find(blog => blog.id === blogToUpdate.id)
  
    assert.strictEqual(blogsDbAfterUpdate.length, helper.initialBlogs.length)
    assert.strictEqual(blogThatWasUpdated.likes, updatedBlog.likes)
  })
})


after(async () => {
  await mongoose.connection.close()
})