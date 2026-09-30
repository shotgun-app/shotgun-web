import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SeatStepper from '../SeatStepper.vue'

function mountStepper(value: number, min = 1, max = 4) {
  return mount(SeatStepper, {
    props: {
      modelValue: value,
      label: 'Seats',
      min,
      max,
      'onUpdate:modelValue': (v: number) => wrapper.setProps({ modelValue: v }),
    },
  })
}
let wrapper: ReturnType<typeof mountStepper>

describe('SeatStepper', () => {
  it('steps up and down within the limits', async () => {
    wrapper = mountStepper(2)
    const [minus, plus] = wrapper.findAll('button')

    await plus!.trigger('click')
    expect(wrapper.props('modelValue')).toBe(3)
    await minus!.trigger('click')
    await minus!.trigger('click')
    expect(wrapper.props('modelValue')).toBe(1)
  })

  it('disables the buttons at the limits', () => {
    wrapper = mountStepper(1, 1, 1)
    const [minus, plus] = wrapper.findAll('button')
    expect(minus!.attributes('disabled')).toBeDefined()
    expect(plus!.attributes('disabled')).toBeDefined()
  })

  it('still accepts a typed value so the form can report it', async () => {
    wrapper = mountStepper(1)
    await wrapper.get('input').setValue(9)
    expect(wrapper.props('modelValue')).toBe(9)
  })
})
