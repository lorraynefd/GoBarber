import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';

class AppointmentController {
    async index(req, res){
        const { page = 1 } = req.query;

        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            order: ['date'],
            limit: 20,
            offset: (page - 1) * 20,
            attributes: ['id', 'date'],
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['id','path','url']
                        },
                    ],
                },
            ],
        });
        return res.json(appointments);
    }

    async store (req, res){
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });
        if(!(await schema.isValid(req.body))){
            return res.status(408).json({ error: 'Validação falsa' });
        }
        const { provider_id, date } = req.body;
        const checkIsProvider = await User.findOne({
            where: { id: provider_id, provider: true},
        });
        if (!checkIsProvider){
            return res
            .status(401)
            .json({ error: ' Você só pode criar compromissos com provedores'});
        }
        const hourStart = startOfHour(parseISO(date));
        if (isBefore(hourStart, new Date())){
            return res.status(400).json({ error:'Data não permitida' });
        }
        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart,
            },
        });
        
        if(checkAvailability){
            return res.status(400).json({ error:'Horario não desponivel' });
        }
        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date
        });
        return res.json(appointment);
    }
}
export default new AppointmentController();