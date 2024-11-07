const { describe, test, after, beforeEach } = require('node:test')
const assert = require('node:assert')

const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const mongoose = require('mongoose')

const helper = require('./test_helper')

const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('POST for USER creation when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()

    const response = await api
      .post('/api/login')
      .send({ username: 'testuser', password: 'password' })

    userToken = response.body.token
  })
  
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
  test('creation fails with proper statuscode if username is less than 3 characters', async () => {
    const newUser = {
      username: '12',
      password: 'password123'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400) 
      .expect('Content-Type', /application\/json/)

      assert(result.body.error.includes('Username and password must be at least 3 characters long'))
  })

  test('creation fails with proper statuscode if password is less than 3 characters', async () => {
    const newUser = {
      username: 'validuser',
      password: '12'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400) 
      .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('Username and password must be at least 3 characters long'))
  })
})

after(async () => {
  await mongoose.connection.close()
})