import * as Yup from 'Yup';
import User from '../models/User';
import { json } from 'sequelize';
import { password } from '../../config/database';

class UserController {
    async store(req,res){
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string().email().required(),
            password: Yup.string().required().min(6),
        });

        if(!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validação inválida' });
        }
        const userExists = await User.findOne({ where: { email: req.body.email }});

        if(userExists){
            return res.status(400).json({error : 'Esse email já existe'})
        }
        const {id, name, email, provider} = await User.create(req.body);

        return res.json({
            id,
            name,
            email,
            provider
        });
    }

    async update(req, res){
        const {email, oldPassword} = req.body;
        const user = await User.findByPk(req.userId);
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup.string().email(),
            oldPassword: Yup.string().min(6),

            password: Yup.string().min(6).when('oldPassword', (oldPassword, field) =>
            oldPassword ? field.required() : field
            ),

            confirmPassword: Yup.string().when('password',(password, field) =>
                password ? field.required().oneOf([Yup.ref('password')]): field
            ),
        });

        if(!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validação falsa' });
        }

        if(email !== user.email){
            const userExists = await User.findOne({ where: { email }});

            if(userExists){
                return res.status(400).json({error : 'Usuario ja existe'})
            }
        }

        if(oldPassword && !(await user.checkPassword(oldPassword))) {
            return res.status(401).json({error: 'A senha antiga não confere'});
        }

        const {id, name, provider} = await user.update(req.body);

        return res.json({
            id,
            name,
            email,
            provider
        });
    }
}

export default new UserController();