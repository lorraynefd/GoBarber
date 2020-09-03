import * as Yup from 'yup';
import {
    startOfHour,
    parseISO,
    isBefore,
    format,
    subHours
} from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';
import Mail from '../../lib/Mail';

class AppointmentController {
    async index(req, res) {
        const {
            page = 1
        } = req.query;

        const appointments = await Appointment.findAll({
            where: {
                user_id: req.userId,
                canceled_at: null
            },
            order: ['date'],
            limit: 20,
            offset: (page - 1) * 20,
            attributes: ['id', 'date', 'past'],
            include: [{
                model: User,
                as: 'provider',
                attributes: ['id', 'name'],
                include: [{
                    model: File,
                    as: 'avatar',
                    attributes: ['id', 'path', 'url', 'cancelable']
                }, ],
            }, ],
        });
        return res.json(appointments);
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });
        if (!(await schema.isValid(req.body))) {
            return res.status(408).json({
                error: 'Validação falsa'
            });
        }
        const {
            provider_id,
            date
        } = req.body;
        const checkIsProvider = await User.findOne({
            where: {
                id: provider_id,
                provider: true
            },
        });
        if (!checkIsProvider) {
            return res
                .status(401)
                .json({
                    error: ' Você só pode criar compromissos com provedores'
                });
        }
        const hourStart = startOfHour(parseISO(date));
        if (isBefore(hourStart, new Date())) {
            return res.status(400).json({
                error: 'Data não permitida'
            });
        }
        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart,
            },
        });

        if (checkAvailability) {
            return res.status(400).json({
                error: 'Horario não desponivel'
            });
        }
        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date
        });
        const user = await User.findByPk(req.userId);
        const formatDate = format(
            hourStart,
            "'dia' dd 'de' MMM', ás' H:mm 'h' ", {
                locale: pt
            }
        );
        await Notification.create({
            content: `Novo agendamento de ${user.name} para ${formatDate} `,
            user: provider_id,
        });
        return res.json(appointment);
    }

    async delete(req, res) {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [{
                    model: User,
                    as: 'provider',
                    attributes: ['name', 'email'],
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['name'],
                }
            ],
        });
        if (appointment.user_id !== req.userId) {
            return res.status(401).json({
                error: "Você não tem permissao para cancelar",
            });
        }
        const dateWithSub = subHours(appointment.date, 2);
        if (isBefore(dateWithSub, new Date())) {
            return res.status(401).json({
                error: 'Você só pode cancelar o agendamento 2hrs antes'
            });
        }
        appointment.canceled_at = new Date();
        await appointment.save();
        await Mail.sendMail({
            to: `${appointment.provider.name} <${appointment.provider.email}>`,
            subject: 'Agendemento cancelado',
            tamplate: 'cancellation',
            context: {
                provider: appointment.provider.name,
                user: appointment.user.name,
                date: format(
                    appointment.date,
                    "'dia' dd 'de' MMM', ás' H:mm 'h' ", {
                        locale: pt
                    }
                ),
            },
        });
        return res.json(appointment);
    }
}
export default new AppointmentController();