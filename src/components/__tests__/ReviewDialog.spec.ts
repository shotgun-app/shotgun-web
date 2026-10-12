import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ReviewDialog from '../ReviewDialog.vue'

const props = {
  title: 'Rate your ride',
  name: 'Ben',
  placeholder: 'How was it?',
  submitting: false,
  error: null,
}

function mountDialog(overrides = {}) {
  return mount(ReviewDialog, {
    props: { ...props, ...overrides },
    global: { stubs: { teleport: true } },
  })
}

describe('ReviewDialog.vue', () => {
  it('cannot submit before a rating is picked', () => {
    const wrapper = mountDialog()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('emits the rating and trimmed comment', async () => {
    const wrapper = mountDialog()
    await wrapper.findAll('[role="radio"]')[3]!.trigger('click')
    await wrapper.get('textarea').setValue('  Smooth ride  ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[{ rating: 4, comment: 'Smooth ride' }]])
  })

  it('emits close from Cancel and shows an error', async () => {
    const wrapper = mountDialog({ error: 'Nope' })
    expect(wrapper.get('[role="alert"]').text()).toBe('Nope')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Cancel')!
      .trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
