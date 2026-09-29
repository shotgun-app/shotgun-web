import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordInput from '../PasswordInput.vue'

describe('PasswordInput', () => {
  it('is masked by default and toggles visibility with the eye button', async () => {
    const wrapper = mount(PasswordInput, { props: { modelValue: 'secret123' } })
    const input = wrapper.get('input')
    const toggle = wrapper.get('button')

    expect(input.attributes('type')).toBe('password')
    expect(toggle.attributes('aria-label')).toBe('Show password')

    await toggle.trigger('click')
    expect(input.attributes('type')).toBe('text')
    expect(toggle.attributes('aria-label')).toBe('Hide password')

    await toggle.trigger('click')
    expect(input.attributes('type')).toBe('password')
  })

  it('emits the typed value', async () => {
    const wrapper = mount(PasswordInput, { props: { modelValue: '' } })
    await wrapper.get('input').setValue('hunter22')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hunter22'])
  })
})
