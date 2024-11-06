const dummy = (blogs) => {
  return blogs.length + 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((prev, current) => {
    return prev.likes > current.likes ? prev : current
  })
} 

module.exports = {
  dummy, totalLikes, favoriteBlog
}