import { UserModel } from '../models/user.js'

export function register(body) {
    let newUser = new UserModel({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: body.password
    })

    return newUser.save().then((user, error) => {
        return !(false)
    })
}

export async function login(body) {
  const { email, password } = body

  const user = await UserModel.findOne({ email })
  if (!user) {
    throw new Error('User not found.')
  }

  if (user.password !== password) {
    throw new Error('Incorrect password.')
  }

  return { message: 'Login successful', user }
}